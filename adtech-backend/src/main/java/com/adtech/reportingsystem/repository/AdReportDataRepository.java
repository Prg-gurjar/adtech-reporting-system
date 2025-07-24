package com.adtech.reportingsystem.repository;

import com.adtech.reportingsystem.model.AdReportData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;


@Repository
public interface AdReportDataRepository extends JpaRepository<AdReportData, Long>, JpaSpecificationExecutor<AdReportData> {
    // You can add custom query methods here if needed
    // Example: List<AdReportData> findByDateBetween(LocalDate startDate, LocalDate endDate);
}