package com.portafolio.energy.repository;

import com.portafolio.energy.model.AnomalyEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AnomalyEventRepository extends JpaRepository<AnomalyEvent, UUID> {

    List<AnomalyEvent> findByResolvedAtIsNullOrderByDetectedAtDesc();

    List<AnomalyEvent> findByDetectedAtBetweenOrderByDetectedAtDesc(Instant start, Instant end);

    List<AnomalyEvent> findTop50ByOrderByDetectedAtDesc();

    Long countByResolvedAtIsNull();

    Long countByDetectedAtBetween(Instant start, Instant end);
}
