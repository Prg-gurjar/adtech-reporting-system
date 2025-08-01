package com.adtech.reportingsystem.dto;

import java.time.LocalDate;

// This is a placeholder DTO. You should adjust its fields
// to precisely match the data you want to expose from AdReportData.
public class AdReportDto {
    private Long id;
    private LocalDate date;
    private String mobileAppResolvedId;
    private String mobileAppName;
    private String domain;
    private String adUnitName;
    private String adUnitId;
    private String inventoryFormatName;
    private String operatingSystemVersionName;
    private Long adExchangeTotalRequests;
    private Long adExchangeResponsesServed;
    private Double adExchangeMatchRate;
    private Long adExchangeLineItemLevelImpressions;
    private Long adExchangeLineItemLevelClicks;
    private Double adExchangeLineItemLevelCtr;
    private Double averageEcpm;
    private Double payout;

    // Getters and Setters (generate these based on your actual needs)

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getMobileAppResolvedId() {
        return mobileAppResolvedId;
    }

    public void setMobileAppResolvedId(String mobileAppResolvedId) {
        this.mobileAppResolvedId = mobileAppResolvedId;
    }

    public String getMobileAppName() {
        return mobileAppName;
    }

    public void setMobileAppName(String mobileAppName) {
        this.mobileAppName = mobileAppName;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public String getAdUnitName() {
        return adUnitName;
    }

    public void setAdUnitName(String adUnitName) {
        this.adUnitName = adUnitName;
    }

    public String getAdUnitId() {
        return adUnitId;
    }

    public void setAdUnitId(String adUnitId) {
        this.adUnitId = adUnitId;
    }

    public String getInventoryFormatName() {
        return inventoryFormatName;
    }

    public void setInventoryFormatName(String inventoryFormatName) {
        this.inventoryFormatName = inventoryFormatName;
    }

    public String getOperatingSystemVersionName() {
        return operatingSystemVersionName;
    }

    public void setOperatingSystemVersionName(String operatingSystemVersionName) {
        this.operatingSystemVersionName = operatingSystemVersionName;
    }

    public Long getAdExchangeTotalRequests() {
        return adExchangeTotalRequests;
    }

    public void setAdExchangeTotalRequests(Long adExchangeTotalRequests) {
        this.adExchangeTotalRequests = adExchangeTotalRequests;
    }

    public Long getAdExchangeResponsesServed() {
        return adExchangeResponsesServed;
    }

    public void setAdExchangeResponsesServed(Long adExchangeResponsesServed) {
        this.adExchangeResponsesServed = adExchangeResponsesServed;
    }

    public Double getAdExchangeMatchRate() {
        return adExchangeMatchRate;
    }

    public void setAdExchangeMatchRate(Double adExchangeMatchRate) {
        this.adExchangeMatchRate = adExchangeMatchRate;
    }

    public Long getAdExchangeLineItemLevelImpressions() {
        return adExchangeLineItemLevelImpressions;
    }

    public void setAdExchangeLineItemLevelImpressions(Long adExchangeLineItemLevelImpressions) {
        this.adExchangeLineItemLevelImpressions = adExchangeLineItemLevelImpressions;
    }

    public Long getAdExchangeLineItemLevelClicks() {
        return adExchangeLineItemLevelClicks;
    }

    public void setAdExchangeLineItemLevelClicks(Long adExchangeLineItemLevelClicks) {
        this.adExchangeLineItemLevelClicks = adExchangeLineItemLevelClicks;
    }

    public Double getAdExchangeLineItemLevelCtr() {
        return adExchangeLineItemLevelCtr;
    }

    public void setAdExchangeLineItemLevelCtr(Double adExchangeLineItemLevelCtr) {
        this.adExchangeLineItemLevelCtr = adExchangeLineItemLevelCtr;
    }

    public Double getAverageEcpm() {
        return averageEcpm;
    }

    public void setAverageEcpm(Double averageEcpm) {
        this.averageEcpm = averageEcpm;
    }

    public Double getPayout() {
        return payout;
    }

    public void setPayout(Double payout) {
        this.payout = payout;
    }
}
