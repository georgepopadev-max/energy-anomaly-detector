package com.portafolio.energy.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "anomaly_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reading_id", nullable = false)
    private UUID readingId;

    @Column(name = "source_id", nullable = false)
    private UUID sourceId;

    @Column(name = "source_name")
    private String sourceName;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false)
    private Double score;

    @Column(nullable = false)
    private String severity;

    private String description;

    private Instant detectedAt;

    private Instant resolvedAt;
}
