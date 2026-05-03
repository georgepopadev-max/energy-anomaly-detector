package com.portafolio.energy.controller;

import com.portafolio.energy.dto.*;
import com.portafolio.energy.service.AnomalyService;
import com.portafolio.energy.service.DataGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class EnergyController {

    private final AnomalyService anomalyService;
    private final DataGeneratorService dataGeneratorService;

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("{\"status\":\"UP\"}");
    }

    @GetMapping("/init")
    public ResponseEntity<String> initializeData() {
        dataGeneratorService.initializeDataSources();
        dataGeneratorService.generateHistoricalData(7);
        anomalyService.processAndDetectAnomalies();
        return ResponseEntity.ok("{\"message\":\"Data initialized successfully\"}");
    }

    @GetMapping("/consumption")
    public ResponseEntity<List<EnergyReadingDto>> getConsumption(
            @RequestParam(defaultValue = "168") int hours) {
        Instant endDate = Instant.now();
        Instant startDate = endDate.minus(hours, ChronoUnit.HOURS);
        return ResponseEntity.ok(anomalyService.getConsumptionData(startDate, endDate));
    }

    @GetMapping("/consumption/{sourceId}")
    public ResponseEntity<List<EnergyReadingDto>> getConsumptionBySource(
            @PathVariable UUID sourceId,
            @RequestParam(defaultValue = "168") int hours) {
        Instant endDate = Instant.now();
        Instant startDate = endDate.minus(hours, ChronoUnit.HOURS);
        List<EnergyReadingDto> data = anomalyService.getConsumptionData(startDate, endDate);
        data = data.stream().filter(r -> r.getSourceId().equals(sourceId)).toList();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/anomalies")
    public ResponseEntity<List<AnomalyEventDto>> getAnomalies(
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        List<AnomalyEventDto> anomalies = activeOnly 
                ? anomalyService.getActiveAnomalies() 
                : anomalyService.getAllAnomalies();
        return ResponseEntity.ok(anomalies);
    }

    @PostMapping("/anomalies/{anomalyId}/resolve")
    public ResponseEntity<List<AnomalyEventDto>> resolveAnomaly(@PathVariable UUID anomalyId) {
        return ResponseEntity.ok(anomalyService.resolveAnomaly(anomalyId));
    }

    @GetMapping("/anomalies/realtime")
    public ResponseEntity<EnergyReadingDto> generateRealtimeReading(
            @RequestParam UUID sourceId) {
        EnergyReadingDto reading = dataGeneratorService.generateRealtimeReading(sourceId);
        if (reading == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(reading);
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getStats() {
        return ResponseEntity.ok(anomalyService.getDashboardStats());
    }

    @GetMapping("/sources")
    public ResponseEntity<List<DataSourceDto>> getDataSources() {
        return ResponseEntity.ok(dataGeneratorService.getAllDataSources());
    }
}
