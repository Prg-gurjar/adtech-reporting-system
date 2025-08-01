package com.adtech.reportingsystem.repository; // Ensure this package matches your actual repository package

import com.adtech.reportingsystem.model.AdReportData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository; // Important: Ensure this is imported

import java.util.List;

@Repository // This annotation is crucial for Spring to detect it as a repository bean
public interface AdReportDataRepository extends
        JpaRepository<AdReportData, Long>,
        JpaSpecificationExecutor<AdReportData> {

    @Query("SELECT DISTINCT a.mobileAppName FROM AdReportData a ORDER BY a.mobileAppName")
    List<String> findDistinctMobileAppName();

    @Query("SELECT DISTINCT a.inventoryFormatName FROM AdReportData a ORDER BY a.inventoryFormatName")
    List<String> findDistinctInventoryFormatName();

    @Query("SELECT DISTINCT a.operatingSystemVersionName FROM AdReportData a ORDER BY a.operatingSystemVersionName")
    List<String> findDistinctOperatingSystemVersionName();
}
