package com.portafolio.energy.repository;

import com.portafolio.energy.model.DataSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DataSourceRepository extends JpaRepository<DataSource, UUID> {
    List<DataSource> findByStatus(String status);
}
