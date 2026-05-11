package com.portafolio.energy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alert_rules")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private String metricType;

    @Column(nullable = false)
    private Double thresholdMin;

    @Column(nullable = false)
    private Double thresholdMax;

    @Column(nullable = false)
    private String severity;

    private Boolean enabled = true;

    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum MetricType {
        CONSUMPTION, VOLTAGE, CURRENT, POWER_FACTOR, DEMAND
    }
}