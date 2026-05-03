package com.portafolio.energy.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private Double totalConsumptionMwh;
    private Long anomalyCount;
    private Double gridHealthPercent;
    private Long alertsResolvedToday;
    private Long activeAnomalies;
    private Double percentAnomalous;
}
