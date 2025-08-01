package com.adtech.reportingsystem.dto;

import java.time.LocalDate;

public class AggregatedReportDto {

    private String mobileAppName;
    private LocalDate date;
    private Double totalPayout;
    private Long totalImpressions;

    // This constructor must match the order and types in the @Query
    public AggregatedReportDto(String mobileAppName, LocalDate date, Double totalPayout, Long totalImpressions) {
        this.mobileAppName = mobileAppName;
        this.date = date;
        this.totalPayout = totalPayout;
        this.totalImpressions = totalImpressions;
    }

    // Getters and setters for the fields
    // (You can use Lombok's @Data annotation for brevity)
    public String getMobileAppName() { return mobileAppName; }
    public void setMobileAppName(String mobileAppName) { this.mobileAppName = mobileAppName; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public Double getTotalPayout() { return totalPayout; }
    public void setTotalPayout(Double totalPayout) { this.totalPayout = totalPayout; }
    public Long getTotalImpressions() { return totalImpressions; }
    public void setTotalImpressions(Long totalImpressions) { this.totalImpressions = totalImpressions; }
}