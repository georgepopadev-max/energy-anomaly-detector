package com.portafolio.energy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "energy_readings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnergyReading {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "source_id", nullable = false)
    private UUID sourceId;

    @Column(name = "source_name")
    private String sourceName;

    @Column(name = "source_type")
    private String sourceType;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "consumption_kwh")
    private Double consumptionKwh;

    private Double voltage;

    private Double frequency;

    @Column(name = "anomaly_score")
    private Double anomalyScore;
}
