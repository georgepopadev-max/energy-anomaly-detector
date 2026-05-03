package com.portafolio.energy.repository;

import com.portafolio.energy.model.EnergyReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface EnergyReadingRepository extends JpaRepository<EnergyReading, UUID> {

    List<EnergyReading> findBySourceIdOrderByTimestampDesc(UUID sourceId);

    List<EnergyReading> findByTimestampBetweenOrderByTimestampAsc(Instant start, Instant end);

    @Query("SELECT SUM(e.consumptionKwh) FROM EnergyReading e WHERE e.timestamp >= :start")
    Double sumConsumptionSince(Instant start);

    @Query("SELECT COUNT(e) FROM EnergyReading e WHERE e.anomalyScore >= :threshold")
    Long countAboveThreshold(Double threshold);
}
