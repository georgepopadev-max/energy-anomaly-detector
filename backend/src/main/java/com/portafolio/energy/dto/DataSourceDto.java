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
public class DataSourceDto {
    private UUID id;
    private String name;
    private String type;
    private String location;
    private String status;
    private Instant createdAt;
}
