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
public class EnergyReadingDto {
    private UUID id;
    private UUID sourceId;
    private String sourceName;
    private String sourceType;
    private Instant timestamp;
    private Double consumptionKwh;
    private Double voltage;
    private Double frequency;
    private Double anomalyScore;
}
