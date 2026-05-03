package com.portafolio.energy.service;

import com.portafolio.energy.dto.AnomalyEventDto;
import com.portafolio.energy.dto.DashboardStatsDto;
import com.portafolio.energy.dto.EnergyReadingDto;
import com.portafolio.energy.ml.AnomalyDetectionService;
import com.portafolio.energy.model.AnomalyEvent;
import com.portafolio.energy.model.EnergyReading;
import com.portafolio.energy.repository.AnomalyEventRepository;
import com.portafolio.energy.repository.EnergyReadingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnomalyService {

    private final EnergyReadingRepository energyReadingRepository;
    private final AnomalyEventRepository anomalyEventRepository;
    private final AnomalyDetectionService anomalyDetectionService;

    @Transactional
    public List<EnergyReadingDto> processAndDetectAnomalies() {
        List<EnergyReading> readings = energyReadingRepository.findAll();
        List<EnergyReading> processedReadings = new ArrayList<>();

        Map<UUID, List<EnergyReading>> readingsBySource = new HashMap<>();
        for (EnergyReading reading : readings) {
            readingsBySource.computeIfAbsent(reading.getSourceId(), k -> new ArrayList<>()).add(reading);
        }

        for (Map.Entry<UUID, List<EnergyReading>> entry : readingsBySource.entrySet()) {
            List<EnergyReading> sourceReadings = entry.getValue();
            sourceReadings.sort(Comparator.comparing(EnergyReading::getTimestamp));

            double[] consumptions = sourceReadings.stream()
                    .mapToDouble(EnergyReading::getConsumptionKwh)
                    .toArray();

            double mean = calculateMean(consumptions);
            double stdDev = calculateStdDev(consumptions, mean);
            double q1 = calculatePercentile(consumptions, 25);
            double q3 = calculatePercentile(consumptions, 75);

            double[] recentValues = new double[Math.min(100, consumptions.length)];
            System.arraycopy(consumptions, Math.max(0, consumptions.length - recentValues.length), 
                    recentValues, 0, recentValues.length);

            for (EnergyReading reading : sourceReadings) {
                double score = anomalyDetectionService.computeAnomalyScore(
                        reading.getConsumptionKwh(), mean, stdDev, q1, q3, recentValues);
                reading.setAnomalyScore(score);
                processedReadings.add(reading);

                if (score >= 0.4) {
                    AnomalyEvent anomaly = AnomalyEvent.builder()
                            .readingId(reading.getId())
                            .sourceId(reading.getSourceId())
                            .sourceName(reading.getSourceName())
                            .timestamp(reading.getTimestamp())
                            .score(score)
                            .severity(anomalyDetectionService.determineSeverity(score))
                            .description(anomalyDetectionService.generateAnomalyDescription(
                                    reading.getConsumptionKwh(), mean, score))
                            .detectedAt(Instant.now())
                            .build();
                    anomalyEventRepository.save(anomaly);
                }
            }
        }

        processedReadings = energyReadingRepository.saveAll(processedReadings);
        log.info("Processed {} readings and detected {} anomalies", 
                processedReadings.size(), anomalyEventRepository.count());
        
        return processedReadings.stream().map(this::toDto).toList();
    }

    @Transactional
    public List<EnergyReadingDto> processSingleReading(EnergyReadingDto readingDto) {
        List<EnergyReading> allReadings = energyReadingRepository.findBySourceIdOrderByTimestampDesc(readingDto.getSourceId());
        
        double[] recentValues = allReadings.stream()
                .limit(100)
                .mapToDouble(EnergyReading::getConsumptionKwh)
                .toArray();

        double mean = calculateMean(recentValues);
        double stdDev = calculateStdDev(recentValues, mean);
        double q1 = calculatePercentile(recentValues, 25);
        double q3 = calculatePercentile(recentValues, 75);

        double score = anomalyDetectionService.computeAnomalyScore(
                readingDto.getConsumptionKwh(), mean, stdDev, q1, q3, recentValues);

        EnergyReading reading = EnergyReading.builder()
                .sourceId(readingDto.getSourceId())
                .sourceName(readingDto.getSourceName())
                .sourceType(readingDto.getSourceType())
                .timestamp(readingDto.getTimestamp())
                .consumptionKwh(readingDto.getConsumptionKwh())
                .voltage(readingDto.getVoltage())
                .frequency(readingDto.getFrequency())
                .anomalyScore(score)
                .build();

        reading = energyReadingRepository.save(reading);

        if (score >= 0.4) {
            AnomalyEvent anomaly = AnomalyEvent.builder()
                    .readingId(reading.getId())
                    .sourceId(reading.getSourceId())
                    .sourceName(reading.getSourceName())
                    .timestamp(reading.getTimestamp())
                    .score(score)
                    .severity(anomalyDetectionService.determineSeverity(score))
                    .description(anomalyDetectionService.generateAnomalyDescription(
                            reading.getConsumptionKwh(), mean, score))
                    .detectedAt(Instant.now())
                    .build();
            anomalyEventRepository.save(anomaly);
        }

        return List.of(toDto(reading));
    }

    public List<EnergyReadingDto> getConsumptionData(Instant startDate, Instant endDate) {
        List<EnergyReading> readings = energyReadingRepository.findByTimestampBetweenOrderByTimestampAsc(startDate, endDate);
        return readings.stream().map(this::toDto).toList();
    }

    public List<AnomalyEventDto> getActiveAnomalies() {
        return anomalyEventRepository.findByResolvedAtIsNullOrderByDetectedAtDesc()
                .stream().map(this::toAnomalyDto).toList();
    }

    public List<AnomalyEventDto> getAllAnomalies() {
        return anomalyEventRepository.findTop50ByOrderByDetectedAtDesc()
                .stream().map(this::toAnomalyDto).toList();
    }

    @Transactional
    public List<AnomalyEventDto> resolveAnomaly(UUID anomalyId) {
        AnomalyEvent anomaly = anomalyEventRepository.findById(anomalyId).orElse(null);
        if (anomaly != null) {
            anomaly.setResolvedAt(Instant.now());
            anomalyEventRepository.save(anomaly);
        }
        return getAllAnomalies();
    }

    public DashboardStatsDto getDashboardStats() {
        Instant todayStart = LocalDate.now().atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant weekStart = Instant.now().minus(7, java.time.temporal.ChronoUnit.DAYS);
        
        List<AnomalyEvent> allAnomalies = anomalyEventRepository.findByDetectedAtBetweenOrderByDetectedAtDesc(weekStart, Instant.now());
        List<EnergyReading> recentReadings = energyReadingRepository.findByTimestampBetweenOrderByTimestampAsc(weekStart, Instant.now());
        
        double totalConsumption = recentReadings.stream()
                .mapToDouble(r -> r.getConsumptionKwh() != null ? r.getConsumptionKwh() : 0.0)
                .sum();
        
        long anomalyCount = allAnomalies.size();
        long activeAnomalies = anomalyEventRepository.countByResolvedAtIsNull();
        long resolvedToday = allAnomalies.stream()
                .filter(a -> a.getResolvedAt() != null && a.getResolvedAt().isAfter(todayStart))
                .count();
        
        long totalReadings = recentReadings.size();
        long anomalousReadings = (int) recentReadings.stream()
                .filter(r -> r.getAnomalyScore() != null && r.getAnomalyScore() >= 0.4)
                .count();
        
        double percentAnomalous = totalReadings > 0 ? (anomalousReadings * 100.0) / totalReadings : 0.0;
        double gridHealth = Math.max(0, 100.0 - (percentAnomalous * 5.0));
        
        return DashboardStatsDto.builder()
                .totalConsumptionMwh(Math.round(totalConsumption / 1000.0 * 100.0) / 100.0)
                .anomalyCount(anomalyCount)
                .gridHealthPercent(Math.round(gridHealth * 100.0) / 100.0)
                .alertsResolvedToday(resolvedToday)
                .activeAnomalies(activeAnomalies)
                .percentAnomalous(Math.round(percentAnomalous * 100.0) / 100.0)
                .build();
    }

    private double calculateMean(double[] values) {
        if (values == null || values.length == 0) return 0.0;
        double sum = 0.0;
        for (double v : values) sum += v;
        return sum / values.length;
    }

    private double calculateStdDev(double[] values, double mean) {
        if (values == null || values.length < 2) return 1.0;
        double sumSquaredDiff = 0.0;
        for (double v : values) sumSquaredDiff += (v - mean) * (v - mean);
        return Math.sqrt(sumSquaredDiff / (values.length - 1));
    }

    private double calculatePercentile(double[] values, int percentile) {
        if (values == null || values.length == 0) return 0.0;
        double[] sorted = values.clone();
        Arrays.sort(sorted);
        int index = (int) Math.ceil(percentile / 100.0 * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    private EnergyReadingDto toDto(EnergyReading reading) {
        return EnergyReadingDto.builder()
                .id(reading.getId())
                .sourceId(reading.getSourceId())
                .sourceName(reading.getSourceName())
                .sourceType(reading.getSourceType())
                .timestamp(reading.getTimestamp())
                .consumptionKwh(reading.getConsumptionKwh())
                .voltage(reading.getVoltage())
                .frequency(reading.getFrequency())
                .anomalyScore(reading.getAnomalyScore())
                .build();
    }

    private AnomalyEventDto toAnomalyDto(AnomalyEvent anomaly) {
        return AnomalyEventDto.builder()
                .id(anomaly.getId())
                .readingId(anomaly.getReadingId())
                .sourceId(anomaly.getSourceId())
                .sourceName(anomaly.getSourceName())
                .timestamp(anomaly.getTimestamp())
                .score(anomaly.getScore())
                .severity(anomaly.getSeverity())
                .description(anomaly.getDescription())
                .detectedAt(anomaly.getDetectedAt())
                .resolvedAt(anomaly.getResolvedAt())
                .build();
    }
}
