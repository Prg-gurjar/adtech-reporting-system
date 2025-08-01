package com.adtech.reportingsystem.service;

import com.adtech.reportingsystem.model.AdReportData;
import com.adtech.reportingsystem.repository.AdReportDataRepository;
import jakarta.persistence.EntityManager; // NEW: Import EntityManager
import jakarta.persistence.PersistenceContext; // NEW: Import PersistenceContext
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Selection;
import jakarta.persistence.Tuple; // NEW: Import Tuple for multi-select results

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

    @Autowired
    private AdReportDataRepository adReportDataRepository;

    @PersistenceContext // Inject EntityManager for Criteria API queries
    private EntityManager entityManager;

    // Inner class for Report Query Request
    public static class ReportQueryRequest {
        private String startDate;
        private String endDate;
        private List<String> mobileAppNames;
        private List<String> inventoryFormatNames;
        private List<String> operatingSystemVersionNames;
        private String searchQuery;
        private List<String> groupByDimensions;
        private List<String> metrics;
        private int page;
        private int size;
        private String sortBy;
        private String sortOrder; // "ASC" or "DESC"

        // Getters and Setters
        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }
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
        public String getSortOrder() { return sortOrder; }
        public void setSortOrder(String sortOrder) { this.sortOrder = sortOrder; }

        @Override
        public String toString() {
            return "ReportQueryRequest{" +
                   "startDate='" + startDate + '\'' +
                   ", endDate='" + endDate + '\'' +
                   ", mobileAppNames=" + mobileAppNames +
                   ", inventoryFormatNames=" + inventoryFormatNames +
                   ", operatingSystemVersionNames=" + operatingSystemVersionNames +
                   ", searchQuery='" + searchQuery + '\'' +
                   ", groupByDimensions=" + groupByDimensions +
                   ", metrics=" + metrics +
                   ", page=" + page +
                   ", size=" + size +
                   ", sortBy='" + sortBy + '\'' +
                   ", sortOrder='" + sortOrder + '\'' +
                   '}';
        }
    }

    // Helper method to build predicates for filtering (reused by both query and aggregate)
    private List<Predicate> buildPredicates(ReportQueryRequest queryRequest, CriteriaBuilder cb, Root<AdReportData> root) {
        List<Predicate> predicates = new ArrayList<>();

        // Date range filter
        if (queryRequest.getStartDate() != null && queryRequest.getEndDate() != null) {
            LocalDate startDate = LocalDate.parse(queryRequest.getStartDate());
            LocalDate endDate = LocalDate.parse(queryRequest.getEndDate());
            predicates.add(cb.between(root.get("date"), startDate, endDate));
        }

        // Multi-select filters
        if (queryRequest.getMobileAppNames() != null && !queryRequest.getMobileAppNames().isEmpty()) {
            predicates.add(root.get("mobileAppName").in(queryRequest.getMobileAppNames()));
        }
        if (queryRequest.getInventoryFormatNames() != null && !queryRequest.getInventoryFormatNames().isEmpty()) {
            predicates.add(root.get("inventoryFormatName").in(queryRequest.getInventoryFormatNames()));
        }
        if (queryRequest.getOperatingSystemVersionNames() != null && !queryRequest.getOperatingSystemVersionNames().isEmpty()) {
            predicates.add(root.get("operatingSystemVersionName").in(queryRequest.getOperatingSystemVersionNames()));
        }

        // Search query (case-insensitive, contains)
        if (queryRequest.getSearchQuery() != null && !queryRequest.getSearchQuery().trim().isEmpty()) {
            String searchPattern = "%" + queryRequest.getSearchQuery().trim().toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("mobileAppName")), searchPattern),
                    cb.like(cb.lower(root.get("adUnitName")), searchPattern),
                    cb.like(cb.lower(root.get("domain")), searchPattern),
                    cb.like(cb.lower(root.get("inventoryFormatName")), searchPattern),
                    cb.like(cb.lower(root.get("operatingSystemVersionName")), searchPattern),
                    cb.like(cb.lower(root.get("adUnitId")), searchPattern),
                    cb.like(cb.lower(root.get("mobileAppResolvedId")), searchPattern)
            ));
        }
        return predicates;
    }

    // Method to get paginated and filtered report data
    public Page<AdReportData> getReportData(ReportQueryRequest queryRequest) {
        logger.debug("Fetching report data with query: {}", queryRequest);

        Sort sort = Sort.unsorted();
        if (queryRequest.getSortBy() != null && queryRequest.getSortOrder() != null) {
            Sort.Direction direction = queryRequest.getSortOrder().equalsIgnoreCase("DESC") ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, queryRequest.getSortBy());
        }

        // Adjust page to be 0-indexed for Spring Data JPA (frontend sends 1-indexed)
        Pageable pageable = PageRequest.of(queryRequest.getPage() - 1, queryRequest.getSize(), sort);

        // Create a Specification using the buildPredicates helper
        Specification<AdReportData> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = buildPredicates(queryRequest, criteriaBuilder, root);
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return adReportDataRepository.findAll(spec, pageable);
    }

    // Method to get aggregated report data (now performs database-level aggregation)
    public List<Map<String, Object>> getAggregatedReportData(ReportQueryRequest queryRequest) {
        logger.debug("Fetching aggregated report data with query: {}", queryRequest);

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Tuple> cq = cb.createTupleQuery(); // Use Tuple to select multiple columns (dimensions + aggregates)
        Root<AdReportData> root = cq.from(AdReportData.class);

        // Apply filters (WHERE clause)
        List<Predicate> predicates = buildPredicates(queryRequest, cb, root);
        if (!predicates.isEmpty()) {
            cq.where(cb.and(predicates.toArray(new Predicate[0])));
        }

        // Dynamic selections (dimensions and aggregated metrics)
        List<Selection<?>> selections = new ArrayList<>();
        List<Expression<?>> groupByExpressions = new ArrayList<>();

        // Add dimensions to selections and group by expressions
        if (queryRequest.getGroupByDimensions() != null && !queryRequest.getGroupByDimensions().isEmpty()) {
            for (String dim : queryRequest.getGroupByDimensions()) {
                Expression<?> dimPath = root.get(dim);
                selections.add(dimPath.alias(dim)); // Alias is important for mapping to Map keys
                groupByExpressions.add(dimPath);
            }
        }

        // Add aggregated metrics to selections
        List<String> metricsToAggregate = queryRequest.getMetrics();
        if (metricsToAggregate == null || metricsToAggregate.isEmpty()) {
            // If no specific metrics requested, aggregate all default metrics for summary
            metricsToAggregate = getAvailableMetrics();
        }

        for (String metric : metricsToAggregate) {
            // Ensure the path is for a Number type for aggregation functions
            Expression<Number> metricPath = root.get(metric);
            switch (metric) {
                // Metrics that are sums (e.g., total counts, payout)
                case "adExchangeTotalRequests":
                case "adExchangeResponsesServed":
                case "adExchangeLineItemLevelImpressions":
                case "adExchangeLineItemLevelClicks":
                case "payout":
                    selections.add(cb.sum(metricPath).alias(metric));
                    break;
                // Metrics that are averages (e.g., rates, eCPM)
                case "adExchangeMatchRate":
                case "adExchangeLineItemLevelCtr":
                case "averageEcpm":
                    selections.add(cb.avg(metricPath).alias(metric));
                    break;
                default:
                    logger.warn("Metric '{}' is not configured for aggregation. Skipping.", metric);
                    // Optionally, you could add the raw metric if it's not meant to be aggregated
                    // selections.add(root.get(metric).alias(metric));
                    break;
            }
        }

        // Set selections for the query
        cq.multiselect(selections.toArray(new Selection[0]));

        // Apply group by clause if dimensions are present
        if (!groupByExpressions.isEmpty()) {
            cq.groupBy(groupByExpressions.toArray(new Expression[0]));
        }

        // Execute the query
        TypedQuery<Tuple> typedQuery = entityManager.createQuery(cq);
        List<Tuple> results = typedQuery.getResultList();

        // Map Tuple results to List<Map<String, Object>>
        List<Map<String, Object>> mappedResults = new ArrayList<>();
        for (Tuple tuple : results) {
            Map<String, Object> row = new LinkedHashMap<>(); // Use LinkedHashMap to preserve order of selections
            for (Selection<?> selection : selections) {
                String alias = selection.getAlias();
                Object value = tuple.get(alias);
                // Special handling for date dimension if present
                if ("date".equals(alias) && value instanceof LocalDate) {
                    row.put(alias, ((LocalDate) value).format(DateTimeFormatter.ISO_LOCAL_DATE));
                } else {
                    row.put(alias, value);
                }
            }
            mappedResults.add(row);
        }

        return mappedResults;
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    // Method to export report data to CSV (remains largely the same, but uses the shared buildPredicates)
    public void exportReport(ReportQueryRequest queryRequest, PrintWriter writer) {
        logger.debug("Exporting report data with query: {}", queryRequest);

        // Create a Specification using the buildPredicates helper
        Specification<AdReportData> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = buildPredicates(queryRequest, criteriaBuilder, root);
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        // Fetch all data matching the filters for export
        List<AdReportData> dataToExport = adReportDataRepository.findAll(spec);

        if (dataToExport.isEmpty()) {
            writer.println("No data available for the selected filters.");
            return;
        }

        // Determine columns dynamically from the first data object or from selected dimensions/metrics
        Set<String> headers = new LinkedHashSet<>();
        headers.add("S.No."); // Add serial number header
        if (queryRequest.getGroupByDimensions() != null && !queryRequest.getGroupByDimensions().isEmpty()) {
            headers.addAll(queryRequest.getGroupByDimensions());
        } else {
            // If no group by, include all default dimensions
            headers.add("mobileAppResolvedId");
            headers.add("mobileAppName");
            headers.add("domain");
            headers.add("adUnitName");
            headers.add("adUnitId");
            headers.add("inventoryFormatName");
            headers.add("operatingSystemVersionName");
            headers.add("date");
        }

        if (queryRequest.getMetrics() != null && !queryRequest.getMetrics().isEmpty()) {
            headers.addAll(queryRequest.getMetrics());
        } else {
            // If no metrics, include all default metrics
            headers.add("adExchangeTotalRequests");
            headers.add("adExchangeResponsesServed");
            headers.add("adExchangeMatchRate");
            headers.add("adExchangeLineItemLevelImpressions");
            headers.add("adExchangeLineItemLevelClicks");
            headers.add("adExchangeLineItemLevelCtr");
            headers.add("averageEcpm");
            headers.add("payout");
        }

        // Write header row
        writer.println(headers.stream()
                .map(this::formatHeader)
                .collect(Collectors.joining(",")));

        // Write data rows
        int serialNumber = 1;
        for (AdReportData data : dataToExport) {
            List<String> rowValues = new ArrayList<>();
            rowValues.add(String.valueOf(serialNumber++)); // Add serial number

            for (String header : headers) {
                if ("S.No.".equals(header)) continue; // Skip S.No. as it's handled separately

                try {
                    // Use reflection to get the value for each header
                    String getterMethodName = "get" + capitalize(header);
                    Object value = AdReportData.class.getMethod(getterMethodName).invoke(data);

                    // Format specific fields
                    if (value instanceof LocalDate) {
                        rowValues.add(((LocalDate) value).format(DateTimeFormatter.ISO_LOCAL_DATE));
                    } else if (value instanceof Double) {
                        // Format doubles to 2 decimal places if they are metrics that usually have decimals
                        if (header.toLowerCase().contains("ecpm") || header.toLowerCase().contains("payout") ||
                            header.toLowerCase().contains("ctr") || header.toLowerCase().contains("rate")) {
                            rowValues.add(String.format(Locale.US, "%.2f", value));
                        } else {
                            rowValues.add(value.toString());
                        }
                    } else if (value != null) {
                        // Escape commas and quotes for CSV
                        String stringValue = value.toString();
                        if (stringValue.contains(",") || stringValue.contains("\"") || stringValue.contains("\n")) {
                            rowValues.add("\"" + stringValue.replace("\"", "\"\"") + "\"");
                        } else {
                            rowValues.add(stringValue);
                        }
                    } else {
                        rowValues.add(""); // Handle null values
                    }
                } catch (NoSuchMethodException e) {
                    logger.warn("No getter found for property {} in AdReportData. Skipping this column for export.", header);
                    rowValues.add(""); // Add empty string if getter not found
                } catch (Exception e) {
                    logger.error("Error getting value for header {} from AdReportData: {}", header, e.getMessage());
                    rowValues.add(""); // Add empty string on error
                }
            }
            writer.println(String.join(",", rowValues));
        }
    }

    private String formatHeader(String header) {
        // Convert camelCase to "Title Case" for display
        String formatted = header.replaceAll("([A-Z])", " $1").trim();
        return formatted.substring(0, 1).toUpperCase() + formatted.substring(1);
    }

    // Existing methods for available dimensions and metrics
    public List<String> getAvailableDimensions() {
        return Arrays.asList(
            "mobileAppResolvedId", "mobileAppName", "domain", "adUnitName", "adUnitId",
            "inventoryFormatName", "operatingSystemVersionName", "date"
        );
    }

    public List<String> getAvailableMetrics() {
        return Arrays.asList(
            "adExchangeTotalRequests", "adExchangeResponsesServed", "adExchangeMatchRate",
            "adExchangeLineItemLevelImpressions", "adExchangeLineItemLevelClicks",
            "adExchangeLineItemLevelCtr", "averageEcpm", "payout"
        );
    }

    // New methods to fetch distinct values (remain unchanged)
    public List<String> getDistinctMobileAppNames() {
        return adReportDataRepository.findDistinctMobileAppName();
    }

    public List<String> getDistinctInventoryFormatNames() {
        return adReportDataRepository.findDistinctInventoryFormatName();
    }

    public List<String> getDistinctOperatingSystemVersionNames() {
        return adReportDataRepository.findDistinctOperatingSystemVersionName();
    }
}
