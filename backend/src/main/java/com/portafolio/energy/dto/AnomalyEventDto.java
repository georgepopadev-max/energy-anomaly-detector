package com.portafolio.energy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyEventDto {
    private UUID id;
    private UUID readingId;
    private UUID sourceId;
    private String sourceName;
    private Instant timestamp;
    private Double score;
    private String severity;
    private String description;
    private Instant detectedAt;
    private Instant resolvedAt;
}
