package com.portafolio.energy.seeder;

import com.portafolio.energy.model.DataSource;
import com.portafolio.energy.model.EnergyReading;
import com.portafolio.energy.model.AnomalyEvent;
import com.portafolio.energy.model.AlertRule;
import com.portafolio.energy.repository.DataSourceRepository;
import com.portafolio.energy.repository.EnergyReadingRepository;
import com.portafolio.energy.repository.AnomalyEventRepository;
import com.portafolio.energy.repository.AlertRuleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;

@Component
public class DataSeeder implements CommandLineRunner {
    
    private final DataSourceRepository dataSourceRepository;
    private final EnergyReadingRepository energyReadingRepository;
    private final AnomalyEventRepository anomalyEventRepository;
    private final AlertRuleRepository alertRuleRepository;
    private final Random random = new Random();
    
    public DataSeeder(DataSourceRepository dataSourceRepository,
                      EnergyReadingRepository energyReadingRepository,
                      AnomalyEventRepository anomalyEventRepository,
                      AlertRuleRepository alertRuleRepository) {
        this.dataSourceRepository = dataSourceRepository;
        this.energyReadingRepository = energyReadingRepository;
        this.anomalyEventRepository = anomalyEventRepository;
        this.alertRuleRepository = alertRuleRepository;
    }
    
    @Override
    public void run(String... args) {
        if (dataSourceRepository.count() > 0) return;
        
        // Seed DataSources
        DataSource ds1 = DataSource.builder()
            .name("Factory Floor A")
            .type("INDUSTRIAL")
            .location("Building A, Floor 1")
            .status("ACTIVE")
            .createdAt(Instant.now())
            .build();
        ds1 = dataSourceRepository.save(ds1);
        
        DataSource ds2 = DataSource.builder()
            .name("Office Building B")
            .type("COMMERCIAL")
            .location("Building B, Floors 1-5")
            .status("ACTIVE")
            .createdAt(Instant.now())
            .build();
        ds2 = dataSourceRepository.save(ds2);
        
        DataSource ds3 = DataSource.builder()
            .name("Warehouse C")
            .type("INDUSTRIAL")
            .location("Building C")
            .status("ACTIVE")
            .createdAt(Instant.now())
            .build();
        ds3 = dataSourceRepository.save(ds3);
        
        DataSource ds4 = DataSource.builder()
            .name("Retail Store D")
            .type("RETAIL")
            .location("Building D")
            .status("ACTIVE")
            .createdAt(Instant.now())
            .build();
        ds4 = dataSourceRepository.save(ds4);
        
        // Seed Energy Readings (last 24 hours)
        Instant now = Instant.now();
        for (DataSource ds : dataSourceRepository.findAll()) {
            for (int i = 0; i < 48; i++) {
                EnergyReading reading = EnergyReading.builder()
                    .sourceId(ds.getId())
                    .sourceName(ds.getName())
                    .sourceType(ds.getType())
                    .timestamp(now.minus(i * 30, ChronoUnit.MINUTES))
                    .consumptionKwh(50.0 + random.nextDouble() * 100)
                    .voltage(220.0 + random.nextDouble() * 20)
                    .frequency(49.5 + random.nextDouble() * 1.0)
                    .anomalyScore(random.nextDouble() * 0.3)
                    .build();
                energyReadingRepository.save(reading);
            }
        }
        
        // Seed Anomaly Events
        for (int i = 0; i < 5; i++) {
            DataSource ds = dataSourceRepository.findAll().get(random.nextInt(4));
            AnomalyEvent event = AnomalyEvent.builder()
                .readingId(java.util.UUID.randomUUID())
                .sourceId(ds.getId())
                .sourceName(ds.getName())
                .timestamp(now.minus(i * 60, ChronoUnit.MINUTES))
                .score(0.7 + random.nextDouble() * 0.3)
                .severity(i % 2 == 0 ? "HIGH" : "MEDIUM")
                .description("Anomalous consumption pattern detected")
                .detectedAt(now.minus(i * 60, ChronoUnit.MINUTES))
                .build();
            anomalyEventRepository.save(event);
        }
        
        // Seed Alert Rules
        alertRuleRepository.save(AlertRule.builder()
            .name("High Consumption Alert")
            .description("Alert when consumption exceeds threshold")
            .metricType("CONSUMPTION")
            .thresholdMin(0.0)
            .thresholdMax(150.0)
            .severity("HIGH")
            .enabled(true)
            .build());
        
        alertRuleRepository.save(AlertRule.builder()
            .name("Voltage Fluctuation")
            .description("Alert when voltage is outside normal range")
            .metricType("VOLTAGE")
            .thresholdMin(210.0)
            .thresholdMax(240.0)
            .severity("MEDIUM")
            .enabled(true)
            .build());
        
        alertRuleRepository.save(AlertRule.builder()
            .name("Frequency Deviation")
            .description("Alert when grid frequency deviates")
            .metricType("FREQUENCY")
            .thresholdMin(49.0)
            .thresholdMax(51.0)
            .severity("CRITICAL")
            .enabled(true)
            .build());
        
        System.out.println("Energy Anomaly Detector Demo Data Seeded!");
    }
}