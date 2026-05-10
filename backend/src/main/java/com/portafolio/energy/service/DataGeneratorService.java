package com.portafolio.energy.service;

import com.portafolio.energy.dto.DataSourceDto;
import com.portafolio.energy.dto.EnergyReadingDto;
import com.portafolio.energy.model.DataSource;
import com.portafolio.energy.model.EnergyReading;
import com.portafolio.energy.repository.DataSourceRepository;
import com.portafolio.energy.repository.EnergyReadingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataGeneratorService {

    private final DataSourceRepository dataSourceRepository;
    private final EnergyReadingRepository energyReadingRepository;
    private final WebSocketService webSocketService;

    private static final Random RANDOM = new Random(42);

    private static final String[] SOURCE_NAMES = {
            "Transformer T-450", "Substation S-Norte", "Residential Meter R-1023",
            "Industrial Plant I-789", "Commercial Building C-456", "Substation S-Sur",
            "Transformer T-230", "Residential Meter R-2156", "Industrial Plant I-345",
            "Commercial Building C-789"
    };

    private static final String[] SOURCE_TYPES = {
            "TRANSFORMER", "SUBSTATION", "METER", "INDUSTRIAL", "COMMERCIAL",
            "SUBSTATION", "TRANSFORMER", "METER", "INDUSTRIAL", "COMMERCIAL"
    };

    private static final String[] LOCATIONS = {
            "Madrid Norte", "Barcelona Centro", "Valencia Este", "Bilbao Oeste",
            "Sevilla Sur", "Zaragoza Norte", "Malaga Costa", "Vigo Puerto"
    };

    private static final Object initLock = new Object();

    @Transactional
    public void initializeDataSources() {
        synchronized (initLock) {
            if (dataSourceRepository.count() == 0) {
                List<DataSource> sources = new ArrayList<>();
                for (int i = 0; i < SOURCE_NAMES.length; i++) {
                    DataSource source = DataSource.builder()
                            .name(SOURCE_NAMES[i])
                            .type(SOURCE_TYPES[i])
                            .location(LOCATIONS[i])
                            .status("ACTIVE")
                            .createdAt(Instant.now())
                            .build();
                    sources.add(source);
                }
                dataSourceRepository.saveAll(sources);
                log.info("Initialized {} data sources", sources.size());
            }
        }
    }

    @Transactional
    public List<EnergyReadingDto> generateHistoricalData(int days) {
        List<DataSource> sources = dataSourceRepository.findAll();
        List<EnergyReading> readings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        Instant startInstant = now.minusDays(days).toInstant(ZoneOffset.UTC);

        for (DataSource source : sources) {
            double baseConsumption = getBaseConsumption(source.getType());
            LocalDateTime current = now.minusDays(days);
            
            while (current.isBefore(now)) {
                double consumption = generateRealisticConsumption(source.getType(), current, baseConsumption);
                double voltage = generateVoltage(source.getType(), current);
                double frequency = 49.5 + RANDOM.nextDouble() * 1.0;
                double anomalyChance = RANDOM.nextDouble();
                
                if (anomalyChance < 0.03) {
                    consumption *= (1.5 + RANDOM.nextDouble() * 2.0);
                } else if (anomalyChance < 0.05) {
                    consumption *= (0.3 + RANDOM.nextDouble() * 0.3);
                }

                EnergyReading reading = EnergyReading.builder()
                        .sourceId(source.getId())
                        .sourceName(source.getName())
                        .sourceType(source.getType())
                        .timestamp(current.toInstant(ZoneOffset.UTC))
                        .consumptionKwh(Math.round(consumption * 100.0) / 100.0)
                        .voltage(Math.round(voltage * 100.0) / 100.0)
                        .frequency(Math.round(frequency * 100.0) / 100.0)
                        .anomalyScore(0.0)
                        .build();
                readings.add(reading);
                current = current.plusHours(1);
            }
        }

        readings = energyReadingRepository.saveAll(readings);
        log.info("Generated {} historical readings for {} sources over {} days", 
                readings.size(), sources.size(), days);
        
        return convertToDto(readings);
    }

    @Transactional
    public EnergyReadingDto generateRealtimeReading(UUID sourceId) {
        DataSource source = dataSourceRepository.findById(sourceId).orElse(null);
        if (source == null) {
            return null;
        }

        double baseConsumption = getBaseConsumption(source.getType());
        LocalDateTime now = LocalDateTime.now();
        double consumption = generateRealisticConsumption(source.getType(), now, baseConsumption);
        double voltage = generateVoltage(source.getType(), now);
        double frequency = 49.5 + RANDOM.nextDouble() * 1.0;

        EnergyReading reading = EnergyReading.builder()
                .sourceId(source.getId())
                .sourceName(source.getName())
                .sourceType(source.getType())
                .timestamp(now.toInstant(ZoneOffset.UTC))
                .consumptionKwh(Math.round(consumption * 100.0) / 100.0)
                .voltage(Math.round(voltage * 100.0) / 100.0)
                .frequency(Math.round(frequency * 100.0) / 100.0)
                .anomalyScore(0.0)
                .build();

        reading = energyReadingRepository.save(reading);
        EnergyReadingDto dto = toDto(reading);
        // Broadcast the new reading to WebSocket subscribers
        webSocketService.broadcastReading(dto);
        return dto;
    }

    public List<DataSourceDto> getAllDataSources() {
        return dataSourceRepository.findAll().stream()
                .map(this::toSourceDto)
                .toList();
    }

    private double getBaseConsumption(String type) {
        return switch (type) {
            case "INDUSTRIAL" -> 250.0 + RANDOM.nextDouble() * 150.0;
            case "COMMERCIAL" -> 80.0 + RANDOM.nextDouble() * 60.0;
            case "SUBSTATION" -> 500.0 + RANDOM.nextDouble() * 200.0;
            case "TRANSFORMER" -> 150.0 + RANDOM.nextDouble() * 100.0;
            default -> 15.0 + RANDOM.nextDouble() * 10.0;
        };
    }

    private double generateRealisticConsumption(String type, LocalDateTime time, double baseConsumption) {
        double hourFactor = getHourFactor(time.getHour());
        double dayFactor = getDayFactor(time.getDayOfWeek());
        double seasonalFactor = getSeasonalFactor(time.getMonthValue());
        double weatherFactor = 0.9 + RANDOM.nextDouble() * 0.2;
        
        double consumption = baseConsumption * hourFactor * dayFactor * seasonalFactor * weatherFactor;
        
        consumption += (RANDOM.nextDouble() - 0.5) * baseConsumption * 0.1;
        
        return consumption;
    }

    private double getHourFactor(int hour) {
        if (hour >= 0 && hour < 6) {
            return 0.3;
        } else if (hour >= 6 && hour < 9) {
            return 0.7;
        } else if (hour >= 9 && hour < 13) {
            return 1.0;
        } else if (hour >= 13 && hour < 18) {
            return 1.1;
        } else if (hour >= 18 && hour < 22) {
            return 1.2;
        } else {
            return 0.5;
        }
    }

    private double getDayFactor(DayOfWeek day) {
        if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
            return 0.7;
        }
        return 1.0;
    }

    private double getSeasonalFactor(int month) {
        return switch (month) {
            case 1, 2 -> 1.3;
            case 12 -> 1.25;
            case 6, 7, 8 -> 1.4;
            case 3, 4, 5 -> 0.9;
            default -> 1.0;
        };
    }

    private double generateVoltage(String type, LocalDateTime time) {
        double baseVoltage = switch (type) {
            case "INDUSTRIAL" -> 400.0;
            case "COMMERCIAL" -> 230.0;
            default -> 220.0;
        };
        
        double variation = (RANDOM.nextDouble() - 0.5) * 10.0;
        double hourVariation = Math.sin(time.getHour() * Math.PI / 12.0) * 5.0;
        
        return baseVoltage + variation + hourVariation;
    }

    private List<EnergyReadingDto> convertToDto(List<EnergyReading> readings) {
        return readings.stream().map(this::toDto).toList();
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

    private DataSourceDto toSourceDto(DataSource source) {
        return DataSourceDto.builder()
                .id(source.getId())
                .name(source.getName())
                .type(source.getType())
                .location(source.getLocation())
                .status(source.getStatus())
                .createdAt(source.getCreatedAt())
                .build();
    }
}
