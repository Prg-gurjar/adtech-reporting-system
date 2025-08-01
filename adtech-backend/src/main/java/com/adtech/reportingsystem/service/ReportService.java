// package com.adtech.reportingsystem.service;

// import com.adtech.reportingsystem.model.AdReportData;
// import com.adtech.reportingsystem.repository.AdReportDataRepository;
// import jakarta.persistence.criteria.Predicate;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.PageRequest;
// import org.springframework.data.domain.Pageable;
// import org.springframework.data.domain.Sort;
// import org.springframework.data.jpa.domain.Specification;
// import org.springframework.stereotype.Service;

// import java.time.LocalDate;
// import java.util.ArrayList;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;
// import java.util.stream.Collectors;

// @Service
// public class ReportService {

//     @Autowired
//     private AdReportDataRepository adReportDataRepository;

//     public List<String> getAvailableDimensions() {
//         return List.of(
//                 "mobileAppResolvedId", "mobileAppName", "domain", "adUnitName",
//                 "adUnitId", "inventoryFormatName", "operatingSystemVersionName", "date"
//         );
//     }

//     public List<String> getAvailableMetrics() {
//         return List.of(
//                 "adExchangeTotalRequests", "adExchangeResponsesServed", "adExchangeMatchRate",
//                 "adExchangeLineItemLevelImpressions", "adExchangeLineItemLevelClicks",
//                 "adExchangeLineItemLevelCtr", "averageEcpm", "payout"
//         );
//     }

//     public Page<AdReportData> getReportData(ReportQueryRequest queryRequest) {
//         Specification<AdReportData> spec = (root, q, cb) -> {
//             List<Predicate> predicates = new ArrayList<>();

//             // Date Range Filter
//             if (queryRequest.getStartDate() != null && queryRequest.getEndDate() != null) {
//                 predicates.add(cb.between(root.get("date"), queryRequest.getStartDate(), queryRequest.getEndDate()));
//             }

//             // Multi-select Filters
//             if (queryRequest.getMobileAppNames() != null && !queryRequest.getMobileAppNames().isEmpty()) {
//                 predicates.add(root.get("mobileAppName").in(queryRequest.getMobileAppNames()));
//             }
//             if (queryRequest.getInventoryFormatNames() != null && !queryRequest.getInventoryFormatNames().isEmpty()) {
//                 predicates.add(root.get("inventoryFormatName").in(queryRequest.getInventoryFormatNames()));
//             }
//             if (queryRequest.getOperatingSystemVersionNames() != null && !queryRequest.getOperatingSystemVersionNames().isEmpty()) {
//                 predicates.add(root.get("operatingSystemVersionName").in(queryRequest.getOperatingSystemVersionNames()));
//             }

//             // Real-time Search (simple example, can be extended)
//             if (queryRequest.getSearchQuery() != null && !queryRequest.getSearchQuery().isEmpty()) {
//                 String searchLike = "%" + queryRequest.getSearchQuery().toLowerCase() + "%";
//                 predicates.add(cb.or(
//                         cb.like(cb.lower(root.get("mobileAppName")), searchLike),
//                         cb.like(cb.lower(root.get("domain")), searchLike),
//                         cb.like(cb.lower(root.get("adUnitName")), searchLike)
//                         // Add more fields to search across
//                 ));
//             }

//             return cb.and(predicates.toArray(new Predicate[0]));
//         };

//         // Sorting
//         Sort sort = Sort.unsorted();
//         if (queryRequest.getSortBy() != null && !queryRequest.getSortBy().isEmpty()) {
//             sort = queryRequest.getSortOrder() == Sort.Direction.ASC ?
//                     Sort.by(queryRequest.getSortBy()).ascending() :
//                     Sort.by(queryRequest.getSortBy()).descending();
//         }

//         // Pagination
//         Pageable pageable = PageRequest.of(queryRequest.getPage(), queryRequest.getSize(), sort);
        
//         return adReportDataRepository.findAll(spec, pageable);
//     }

//     // This method will perform in-memory grouping and aggregation for simplicity.
//     // For very large datasets and complex aggregations, you would typically
//     // use native SQL queries or a more advanced OLAP solution.
//     public List<Map<String, Object>> getAggregatedReportData(ReportQueryRequest queryRequest) {
//         List<AdReportData> rawData = adReportDataRepository.findAll(getSpecificationForAggregation(queryRequest));

//         if (queryRequest.getGroupByDimensions() == null || queryRequest.getGroupByDimensions().isEmpty()) {
//             // If no grouping, aggregate all data
//             return aggregateData(rawData, queryRequest.getMetrics());
//         }

//         return rawData.stream()
//                 .collect(Collectors.groupingBy(data -> {
//                     Map<String, Object> key = new HashMap<>();
//                     for (String dim : queryRequest.getGroupByDimensions()) {
//                         try {
//                             // Use reflection for dynamic dimension access
//                             java.lang.reflect.Method getter = AdReportData.class.getMethod("get" + capitalize(dim));
//                             key.put(dim, getter.invoke(data));
//                         } catch (Exception e) {
//                             System.err.println("Error accessing getter for dimension " + dim + ": " + e.getMessage());
//                             // Handle error or skip
//                         }
//                     }
//                     return key;
//                 }))
//                 .entrySet()
//                 .stream()
//                 .map(entry -> {
//                     Map<String, Object> aggregatedRow = new HashMap<>(entry.getKey());
//                     List<AdReportData> groupedData = entry.getValue();
//                     aggregateMetricsIntoMap(groupedData, queryRequest.getMetrics(), aggregatedRow);
//                     return aggregatedRow;
//                 })
//                 .collect(Collectors.toList());
//     }

//     private Specification<AdReportData> getSpecificationForAggregation(ReportQueryRequest queryRequest) {
//         return (root, q, cb) -> {
//             List<Predicate> predicates = new ArrayList<>();

//             if (queryRequest.getStartDate() != null && queryRequest.getEndDate() != null) {
//                 predicates.add(cb.between(root.get("date"), queryRequest.getStartDate(), queryRequest.getEndDate()));
//             }

//             if (queryRequest.getMobileAppNames() != null && !queryRequest.getMobileAppNames().isEmpty()) {
//                 predicates.add(root.get("mobileAppName").in(queryRequest.getMobileAppNames()));
//             }
//             if (queryRequest.getInventoryFormatNames() != null && !queryRequest.getInventoryFormatNames().isEmpty()) {
//                 predicates.add(root.get("inventoryFormatName").in(queryRequest.getInventoryFormatNames()));
//             }
//             if (queryRequest.getOperatingSystemVersionNames() != null && !queryRequest.getOperatingSystemVersionNames().isEmpty()) {
//                 predicates.add(root.get("operatingSystemVersionName").in(queryRequest.getOperatingSystemVersionNames()));
//             }

//             if (queryRequest.getSearchQuery() != null && !queryRequest.getSearchQuery().isEmpty()) {
//                 String searchLike = "%" + queryRequest.getSearchQuery().toLowerCase() + "%";
//                 predicates.add(cb.or(
//                         cb.like(cb.lower(root.get("mobileAppName")), searchLike),
//                         cb.like(cb.lower(root.get("domain")), searchLike),
//                         cb.like(cb.lower(root.get("adUnitName")), searchLike)
//                 ));
//             }

//             return cb.and(predicates.toArray(new Predicate[0]));
//         };
//     }

//     private List<Map<String, Object>> aggregateData(List<AdReportData> data, List<String> metrics) {
//         Map<String, Object> aggregated = new HashMap<>();
//         aggregateMetricsIntoMap(data, metrics, aggregated);
//         return List.of(aggregated); // Return as a list for consistency
//     }

//     private void aggregateMetricsIntoMap(List<AdReportData> data, List<String> metrics, Map<String, Object> targetMap) {
//         if (metrics == null || metrics.isEmpty()) return;

//         Map<String, Double> sums = new HashMap<>();
//         Map<String, Integer> counts = new HashMap<>(); // For averages

//         for (String metric : metrics) {
//             sums.put(metric, 0.0);
//             counts.put(metric, 0);
//         }

//         for (AdReportData row : data) {
//             for (String metric : metrics) {
//                 try {
//                     java.lang.reflect.Method getter = AdReportData.class.getMethod("get" + capitalize(metric));
//                     Object value = getter.invoke(row);
//                     if (value instanceof Number) {
//                         sums.put(metric, sums.get(metric) + ((Number) value).doubleValue());
//                         counts.put(metric, counts.get(metric) + 1);
//                     }
//                 } catch (Exception e) {
//                     System.err.println("Error accessing getter for metric " + metric + ": " + e.getMessage());
//                 }
//             }
//         }

//         for (String metric : metrics) {
//             if (metric.toLowerCase().contains("average") && counts.get(metric) > 0) {
//                 targetMap.put(metric, sums.get(metric) / counts.get(metric));
//             } else {
//                 targetMap.put(metric, sums.get(metric));
//             }
//         }
//     }


//     private String capitalize(String str) {
//         if (str == null || str.isEmpty()) {
//             return str;
//         }
//         return Character.toUpperCase(str.charAt(0)) + str.substring(1);
//     }

//     // DTO for Report Query Request
//     // This should be a separate class, but for brevity, included here.
//     public static class ReportQueryRequest {
//         private LocalDate startDate;
//         private LocalDate endDate;
//         private List<String> mobileAppNames;
//         private List<String> inventoryFormatNames;
//         private List<String> operatingSystemVersionNames;
//         private String searchQuery;
//         private List<String> groupByDimensions;
//         private List<String> metrics;
//         private int page;
//         private int size;
//         private String sortBy;
//         private Sort.Direction sortOrder;

//         // Getters and Setters (Lombok @Data would generate these)
//         public LocalDate getStartDate() { return startDate; }
//         public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
//         public LocalDate getEndDate() { return endDate; }
//         public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
//         public List<String> getMobileAppNames() { return mobileAppNames; }
//         public void setMobileAppNames(List<String> mobileAppNames) { this.mobileAppNames = mobileAppNames; }
//         public List<String> getInventoryFormatNames() { return inventoryFormatNames; }
//         public void setInventoryFormatNames(List<String> inventoryFormatNames) { this.inventoryFormatNames = inventoryFormatNames; }
//         public List<String> getOperatingSystemVersionNames() { return operatingSystemVersionNames; }
//         public void setOperatingSystemVersionNames(List<String> operatingSystemVersionNames) { this.operatingSystemVersionNames = operatingSystemVersionNames; }
//         public String getSearchQuery() { return searchQuery; }
//         public void setSearchQuery(String searchQuery) { this.searchQuery = searchQuery; }
//         public List<String> getGroupByDimensions() { return groupByDimensions; }
//         public void setGroupByDimensions(List<String> groupByDimensions) { this.groupByDimensions = groupByDimensions; }
//         public List<String> getMetrics() { return metrics; }
//         public void setMetrics(List<String> metrics) { this.metrics = metrics; }
//         public int getPage() { return page; }
//         public void setPage(int page) { this.page = page; }
//         public int getSize() { return size; }
//         public void setSize(int size) { this.size = size; }
//         public String getSortBy() { return sortBy; }
//         public void setSortBy(String sortBy) { this.sortBy = sortBy; }
//         public Sort.Direction getSortOrder() { return sortOrder; }
//         public void setSortOrder(Sort.Direction sortOrder) { this.sortOrder = sortOrder; }
//     }
// }

package com.adtech.reportingsystem.service;

import com.adtech.reportingsystem.model.AdReportData;
import com.adtech.reportingsystem.repository.AdReportDataRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Selection;
import jakarta.persistence.Tuple;

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

    @PersistenceContext
    private EntityManager entityManager;

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
        private String sortOrder;

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

    private List<Predicate> buildPredicates(ReportQueryRequest queryRequest, CriteriaBuilder cb, Root<AdReportData> root) {
        List<Predicate> predicates = new ArrayList<>();

        if (queryRequest.getStartDate() != null && queryRequest.getEndDate() != null) {
            LocalDate startDate = LocalDate.parse(queryRequest.getStartDate());
            LocalDate endDate = LocalDate.parse(queryRequest.getEndDate());
            predicates.add(cb.between(root.get("date"), startDate, endDate));
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

    public Page<AdReportData> getReportData(ReportQueryRequest queryRequest) {
        logger.debug("Fetching report data with query: {}", queryRequest);

        Sort sort = Sort.unsorted();
        if (queryRequest.getSortBy() != null && queryRequest.getSortOrder() != null) {
            Sort.Direction direction = queryRequest.getSortOrder().equalsIgnoreCase("DESC") ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = Sort.by(direction, queryRequest.getSortBy());
        }

        Pageable pageable = PageRequest.of(queryRequest.getPage() - 1, queryRequest.getSize(), sort);

        Specification<AdReportData> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = buildPredicates(queryRequest, criteriaBuilder, root);
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return adReportDataRepository.findAll(spec, pageable);
    }

    public List<Map<String, Object>> getAggregatedReportData(ReportQueryRequest queryRequest) {
        logger.debug("Fetching aggregated report data with query: {}", queryRequest);

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Tuple> cq = cb.createTupleQuery();
        Root<AdReportData> root = cq.from(AdReportData.class);

        List<Predicate> predicates = buildPredicates(queryRequest, cb, root);
        if (!predicates.isEmpty()) {
            cq.where(cb.and(predicates.toArray(new Predicate[0])));
        }

        List<Selection<?>> selections = new ArrayList<>();
        List<Expression<?>> groupByExpressions = new ArrayList<>();

        if (queryRequest.getGroupByDimensions() != null && !queryRequest.getGroupByDimensions().isEmpty()) {
            for (String dim : queryRequest.getGroupByDimensions()) {
                Expression<?> dimPath = root.get(dim);
                selections.add(dimPath.alias(dim));
                groupByExpressions.add(dimPath);
            }
        }

        List<String> metricsToAggregate = queryRequest.getMetrics();
        if (metricsToAggregate == null || metricsToAggregate.isEmpty()) {
            metricsToAggregate = getAvailableMetrics();
        }

        for (String metric : metricsToAggregate) {
            Expression<Number> metricPath = root.get(metric);
            switch (metric) {
                case "adExchangeTotalRequests":
                case "adExchangeResponsesServed":
                case "adExchangeLineItemLevelImpressions":
                case "adExchangeLineItemLevelClicks":
                case "payout":
                    selections.add(cb.sum(metricPath).alias(metric));
                    break;
                case "adExchangeMatchRate":
                case "adExchangeLineItemLevelCtr":
                case "averageEcpm":
                    selections.add(cb.avg(metricPath).alias(metric));
                    break;
                default:
                    logger.warn("Metric '{}' is not configured for aggregation. Skipping.", metric);
                    break;
            }
        }

        cq.multiselect(selections.toArray(new Selection[0]));

        if (!groupByExpressions.isEmpty()) {
            cq.groupBy(groupByExpressions.toArray(new Expression[0]));
        }

        TypedQuery<Tuple> typedQuery = entityManager.createQuery(cq);
        List<Tuple> results = typedQuery.getResultList();

        List<Map<String, Object>> mappedResults = new ArrayList<>();
        for (Tuple tuple : results) {
            Map<String, Object> row = new LinkedHashMap<>();
            for (Selection<?> selection : selections) {
                String alias = selection.getAlias();
                Object value = tuple.get(alias);
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

    public void exportReport(ReportQueryRequest queryRequest, PrintWriter writer) {
        logger.debug("Exporting report data with query: {}", queryRequest);

        Specification<AdReportData> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = buildPredicates(queryRequest, criteriaBuilder, root);
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        List<AdReportData> dataToExport = adReportDataRepository.findAll(spec);

        if (dataToExport.isEmpty()) {
            writer.println("No data available for the selected filters.");
            return;
        }

        Set<String> headers = new LinkedHashSet<>();
        headers.add("S.No.");
        if (queryRequest.getGroupByDimensions() != null && !queryRequest.getGroupByDimensions().isEmpty()) {
            headers.addAll(queryRequest.getGroupByDimensions());
        } else {
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
            headers.add("adExchangeTotalRequests");
            headers.add("adExchangeResponsesServed");
            headers.add("adExchangeMatchRate");
            headers.add("adExchangeLineItemLevelImpressions");
            headers.add("adExchangeLineItemLevelClicks");
            headers.add("adExchangeLineItemLevelCtr");
            headers.add("averageEcpm");
            headers.add("payout");
        }

        writer.println(headers.stream()
                .map(this::formatHeader)
                .collect(Collectors.joining(",")));

        int serialNumber = 1;
        for (AdReportData data : dataToExport) {
            List<String> rowValues = new ArrayList<>();
            rowValues.add(String.valueOf(serialNumber++));

            for (String header : headers) {
                if ("S.No.".equals(header)) continue;

                try {
                    String getterMethodName = "get" + capitalize(header);
                    Object value = AdReportData.class.getMethod(getterMethodName).invoke(data);

                    if (value instanceof LocalDate) {
                        rowValues.add(((LocalDate) value).format(DateTimeFormatter.ISO_LOCAL_DATE));
                    } else if (value instanceof Double) {
                        if (header.toLowerCase().contains("ecpm") || header.toLowerCase().contains("payout") ||
                            header.toLowerCase().contains("ctr") || header.toLowerCase().contains("rate")) {
                            rowValues.add(String.format(Locale.US, "%.2f", value));
                        } else {
                            rowValues.add(value.toString());
                        }
                    } else if (value != null) {
                        String stringValue = value.toString();
                        if (stringValue.contains(",") || stringValue.contains("\"") || stringValue.contains("\n")) {
                            rowValues.add("\"" + stringValue.replace("\"", "\"\"") + "\"");
                        } else {
                            rowValues.add(stringValue);
                        }
                    } else {
                        rowValues.add("");
                    }
                } catch (NoSuchMethodException e) {
                    logger.warn("No getter found for property {} in AdReportData. Skipping this column for export.", header);
                    rowValues.add("");
                } catch (Exception e) {
                    logger.error("Error getting value for header {} from AdReportData: {}", header, e.getMessage());
                    rowValues.add("");
                }
            }
            writer.println(String.join(",", rowValues));
        }
    }

    private String formatHeader(String header) {
        String formatted = header.replaceAll("([A-Z])", " $1").trim();
        return formatted.substring(0, 1).toUpperCase() + formatted.substring(1);
    }

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
