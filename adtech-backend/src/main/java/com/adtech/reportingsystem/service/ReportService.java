package com.adtech.reportingsystem.service;

import com.adtech.reportingsystem.model.AdReportData;
import com.adtech.reportingsystem.repository.AdReportDataRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private AdReportDataRepository adReportDataRepository;

    public List<String> getAvailableDimensions() {
        return List.of(
                "mobileAppResolvedId", "mobileAppName", "domain", "adUnitName",
                "adUnitId", "inventoryFormatName", "operatingSystemVersionName", "date"
        );
    }

    public List<String> getAvailableMetrics() {
        return List.of(
                "adExchangeTotalRequests", "adExchangeResponsesServed", "adExchangeMatchRate",
                "adExchangeLineItemLevelImpressions", "adExchangeLineItemLevelClicks",
                "adExchangeLineItemLevelCtr", "averageEcpm", "payout"
        );
    }

    public Page<AdReportData> getReportData(ReportQueryRequest queryRequest) {
        Specification<AdReportData> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Date Range Filter
            if (queryRequest.getStartDate() != null && queryRequest.getEndDate() != null) {
                predicates.add(cb.between(root.get("date"), queryRequest.getStartDate(), queryRequest.getEndDate()));
            }

            // Multi-select Filters
            if (queryRequest.getMobileAppNames() != null && !queryRequest.getMobileAppNames().isEmpty()) {
                predicates.add(root.get("mobileAppName").in(queryRequest.getMobileAppNames()));
            }
            if (queryRequest.getInventoryFormatNames() != null && !queryRequest.getInventoryFormatNames().isEmpty()) {
                predicates.add(root.get("inventoryFormatName").in(queryRequest.getInventoryFormatNames()));
            }
            if (queryRequest.getOperatingSystemVersionNames() != null && !queryRequest.getOperatingSystemVersionNames().isEmpty()) {
                predicates.add(root.get("operatingSystemVersionName").in(queryRequest.getOperatingSystemVersionNames()));
            }

            // Real-time Search (simple example, can be extended)
            if (queryRequest.getSearchQuery() != null && !queryRequest.getSearchQuery().isEmpty()) {
                String searchLike = "%" + queryRequest.getSearchQuery().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("mobileAppName")), searchLike),
                        cb.like(cb.lower(root.get("domain")), searchLike),
                        cb.like(cb.lower(root.get("adUnitName")), searchLike)
                        // Add more fields to search across
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Sorting
        Sort sort = Sort.unsorted();
        if (queryRequest.getSortBy() != null && !queryRequest.getSortBy().isEmpty()) {
            sort = queryRequest.getSortOrder() == Sort.Direction.ASC ?
                    Sort.by(queryRequest.getSortBy()).ascending() :
                    Sort.by(queryRequest.getSortBy()).descending();
        }

        // Pagination
        Pageable pageable = PageRequest.of(queryRequest.getPage(), queryRequest.getSize(), sort);
        
        return adReportDataRepository.findAll(spec, pageable);
    }

    // This method will perform in-memory grouping and aggregation for simplicity.
    // For very large datasets and complex aggregations, you would typically
    // use native SQL queries or a more advanced OLAP solution.
    public List<Map<String, Object>> getAggregatedReportData(ReportQueryRequest queryRequest) {
        List<AdReportData> rawData = adReportDataRepository.findAll(getSpecificationForAggregation(queryRequest));

        if (queryRequest.getGroupByDimensions() == null || queryRequest.getGroupByDimensions().isEmpty()) {
            // If no grouping, aggregate all data
            return aggregateData(rawData, queryRequest.getMetrics());
        }

        return rawData.stream()
                .collect(Collectors.groupingBy(data -> {
                    Map<String, Object> key = new HashMap<>();
                    for (String dim : queryRequest.getGroupByDimensions()) {
                        try {
                            // Use reflection for dynamic dimension access
                            java.lang.reflect.Method getter = AdReportData.class.getMethod("get" + capitalize(dim));
                            key.put(dim, getter.invoke(data));
                        } catch (Exception e) {
                            System.err.println("Error accessing getter for dimension " + dim + ": " + e.getMessage());
                            // Handle error or skip
                        }
                    }
                    return key;
                }))
                .entrySet()
                .stream()
                .map(entry -> {
                    Map<String, Object> aggregatedRow = new HashMap<>(entry.getKey());
                    List<AdReportData> groupedData = entry.getValue();
                    aggregateMetricsIntoMap(groupedData, queryRequest.getMetrics(), aggregatedRow);
                    return aggregatedRow;
                })
                .collect(Collectors.toList());
    }

    private Specification<AdReportData> getSpecificationForAggregation(ReportQueryRequest queryRequest) {
        return (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (queryRequest.getStartDate() != null && queryRequest.getEndDate() != null) {
                predicates.add(cb.between(root.get("date"), queryRequest.getStartDate(), queryRequest.getEndDate()));
            }

            if (queryRequest.getMobileAppNames() != null && !queryRequest.getMobileAppNames().isEmpty()) {
                predicates.add(root.get("mobileAppName").in(queryRequest.getMobileAppNames()));
            }
            if (queryRequest.getInventoryFormatNames() != null && !queryRequest.getInventoryFormatNames().isEmpty()) {
                predicates.add(root.get("inventoryFormatName").in(queryRequest.getInventoryFormatNames()));
            }
            if (queryRequest.getOperatingSystemVersionNames() != null && !queryRequest.getOperatingSystemVersionNames().isEmpty()) {
                predicates.add(root.get("operatingSystemVersionName").in(queryRequest.getOperatingSystemVersionNames()));
            }

            if (queryRequest.getSearchQuery() != null && !queryRequest.getSearchQuery().isEmpty()) {
                String searchLike = "%" + queryRequest.getSearchQuery().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("mobileAppName")), searchLike),
                        cb.like(cb.lower(root.get("domain")), searchLike),
                        cb.like(cb.lower(root.get("adUnitName")), searchLike)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private List<Map<String, Object>> aggregateData(List<AdReportData> data, List<String> metrics) {
        Map<String, Object> aggregated = new HashMap<>();
        aggregateMetricsIntoMap(data, metrics, aggregated);
        return List.of(aggregated); // Return as a list for consistency
    }

    private void aggregateMetricsIntoMap(List<AdReportData> data, List<String> metrics, Map<String, Object> targetMap) {
        if (metrics == null || metrics.isEmpty()) return;

        Map<String, Double> sums = new HashMap<>();
        Map<String, Integer> counts = new HashMap<>(); // For averages

        for (String metric : metrics) {
            sums.put(metric, 0.0);
            counts.put(metric, 0);
        }

        for (AdReportData row : data) {
            for (String metric : metrics) {
                try {
                    java.lang.reflect.Method getter = AdReportData.class.getMethod("get" + capitalize(metric));
                    Object value = getter.invoke(row);
                    if (value instanceof Number) {
                        sums.put(metric, sums.get(metric) + ((Number) value).doubleValue());
                        counts.put(metric, counts.get(metric) + 1);
                    }
                } catch (Exception e) {
                    System.err.println("Error accessing getter for metric " + metric + ": " + e.getMessage());
                }
            }
        }

        for (String metric : metrics) {
            if (metric.toLowerCase().contains("average") && counts.get(metric) > 0) {
                targetMap.put(metric, sums.get(metric) / counts.get(metric));
            } else {
                targetMap.put(metric, sums.get(metric));
            }
        }
    }


    private String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return Character.toUpperCase(str.charAt(0)) + str.substring(1);
    }

    // DTO for Report Query Request
    // This should be a separate class, but for brevity, included here.
    public static class ReportQueryRequest {
        private LocalDate startDate;
        private LocalDate endDate;
        private List<String> mobileAppNames;
        private List<String> inventoryFormatNames;
        private List<String> operatingSystemVersionNames;
        private String searchQuery;
        private List<String> groupByDimensions;
        private List<String> metrics;
        private int page;
        private int size;
        private String sortBy;
        private Sort.Direction sortOrder;

        // Getters and Setters (Lombok @Data would generate these)
        public LocalDate getStartDate() { return startDate; }
        public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
        public LocalDate getEndDate() { return endDate; }
        public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
        public List<String> getMobileAppNames() { return mobileAppNames; }
        public void setMobileAppNames(List<String> mobileAppNames) { this.mobileAppNames = mobileAppNames; }
        public List<String> getInventoryFormatNames() { return inventoryFormatNames; }
        public void setInventoryFormatNames(List<String> inventoryFormatNames) { this.inventoryFormatNames = inventoryFormatNames; }
        public List<String> getOperatingSystemVersionNames() { return operatingSystemVersionNames; }
        public void setOperatingSystemVersionNames(List<String> operatingSystemVersionNames) { this.operatingSystemVersionNames = operatingSystemVersionNames; }
        public String getSearchQuery() { return searchQuery; }
        public void setSearchQuery(String searchQuery) { this.searchQuery = searchQuery; }
        public List<String> getGroupByDimensions() { return groupByDimensions; }
        public void setGroupByDimensions(List<String> groupByDimensions) { this.groupByDimensions = groupByDimensions; }
        public List<String> getMetrics() { return metrics; }
        public void setMetrics(List<String> metrics) { this.metrics = metrics; }
        public int getPage() { return page; }
        public void setPage(int page) { this.page = page; }
        public int getSize() { return size; }
        public void setSize(int size) { this.size = size; }
        public String getSortBy() { return sortBy; }
        public void setSortBy(String sortBy) { this.sortBy = sortBy; }
        public Sort.Direction getSortOrder() { return sortOrder; }
        public void setSortOrder(Sort.Direction sortOrder) { this.sortOrder = sortOrder; }
    }
}