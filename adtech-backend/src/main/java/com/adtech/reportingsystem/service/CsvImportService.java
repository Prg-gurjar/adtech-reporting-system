// package com.adtech.reportingsystem.service;

// import com.adtech.reportingsystem.model.AdReportData;
// import com.adtech.reportingsystem.repository.AdReportDataRepository;
// import jakarta.persistence.EntityManager; // NEW: Import EntityManager
// import jakarta.persistence.PersistenceContext; // NEW: Import PersistenceContext
// import jakarta.persistence.TypedQuery;
// import jakarta.persistence.criteria.CriteriaBuilder;
// import jakarta.persistence.criteria.CriteriaQuery;
// import jakarta.persistence.criteria.Expression;
// import jakarta.persistence.criteria.Predicate;
// import jakarta.persistence.criteria.Root;
// import jakarta.persistence.criteria.Selection;
// import jakarta.persistence.Tuple; // NEW: Import Tuple for multi-select results

// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.PageRequest;
// import org.springframework.data.domain.Pageable;
// import org.springframework.data.domain.Sort;
// import org.springframework.data.jpa.domain.Specification;
// import org.springframework.stereotype.Service;

// import java.io.PrintWriter;
// import java.time.LocalDate;
// import java.time.format.DateTimeFormatter;
// import java.util.*;
// import java.util.stream.Collectors;

// @Service
// public class ReportService {

//     private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

//     @Autowired
//     private AdReportDataRepository adReportDataRepository;

//     @PersistenceContext // Inject EntityManager for Criteria API queries
//     private EntityManager entityManager;

//     // Inner class for Report Query Request
//     public static class ReportQueryRequest {
//         private String startDate;
//         private String endDate;
//         private List<String> mobileAppNames;
//         private List<String> inventoryFormatNames;
//         private List<String> operatingSystemVersionNames;
//         private String searchQuery;
//         private List<String> groupByDimensions;
//         private List<String> metrics;
//         private int page;
//         private int size;
//         private String sortBy;
//         private String sortOrder; // "ASC" or "DESC"

//         // Getters and Setters
//         public String getStartDate() { return startDate; }
//         public void setStartDate(String startDate) { this.startDate = startDate; }
//         public String getEndDate() { return endDate; }
//         public void setEndDate(String endDate) { this.endDate = endDate; }
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
//         public String getSortOrder() { return sortOrder; }
//         public void setSortOrder(String sortOrder) { this.sortOrder = sortOrder; }

//         @Override
//         public String toString() {
//             return "ReportQueryRequest{" +
//                    "startDate='" + startDate + '\'' +
//                    ", endDate='" + endDate + '\'' +
//                    ", mobileAppNames=" + mobileAppNames +
//                    ", inventoryFormatNames=" + inventoryFormatNames +
//                    ", operatingSystemVersionNames=" + operatingSystemVersionNames +
//                    ", searchQuery='" + searchQuery + '\'' +
//                    ", groupByDimensions=" + groupByDimensions +
//                    ", metrics=" + metrics +
//                    ", page=" + page +
//                    ", size=" + size +
//                    ", sortBy='" + sortBy + '\'' +
//                    ", sortOrder='" + sortOrder + '\'' +
//                    '}';
//         }
//     }

//     // Helper method to build predicates for filtering (reused by both query and aggregate)
//     private List<Predicate> buildPredicates(ReportQueryRequest queryRequest, CriteriaBuilder cb, Root<AdReportData> root) {
//         List<Predicate> predicates = new ArrayList<>();

//         // Date range filter
//         if (queryRequest.getStartDate() != null && queryRequest.getEndDate() != null) {
//             LocalDate startDate = LocalDate.parse(queryRequest.getStartDate());
//             LocalDate endDate = LocalDate.parse(queryRequest.getEndDate());
//             predicates.add(cb.between(root.get("date"), startDate, endDate));
//         }

//         // Multi-select filters
//         if (queryRequest.getMobileAppNames() != null && !queryRequest.getMobileAppNames().isEmpty()) {
//             predicates.add(root.get("mobileAppName").in(queryRequest.getMobileAppNames()));
//         }
//         if (queryRequest.getInventoryFormatNames() != null && !queryRequest.getInventoryFormatNames().isEmpty()) {
//             predicates.add(root.get("inventoryFormatName").in(queryRequest.getInventoryFormatNames()));
//         }
//         if (queryRequest.getOperatingSystemVersionNames() != null && !queryRequest.getOperatingSystemVersionNames().isEmpty()) {
//             predicates.add(root.get("operatingSystemVersionName").in(queryRequest.getOperatingSystemVersionNames()));
//         }

//         // Search query (case-insensitive, contains)
//         if (queryRequest.getSearchQuery() != null && !queryRequest.getSearchQuery().trim().isEmpty()) {
//             String searchPattern = "%" + queryRequest.getSearchQuery().trim().toLowerCase() + "%";
//             predicates.add(cb.or(
//                     cb.like(cb.lower(root.get("mobileAppName")), searchPattern),
//                     cb.like(cb.lower(root.get("adUnitName")), searchPattern),
//                     cb.like(cb.lower(root.get("domain")), searchPattern),
//                     cb.like(cb.lower(root.get("inventoryFormatName")), searchPattern),
//                     cb.like(cb.lower(root.get("operatingSystemVersionName")), searchPattern),
//                     cb.like(cb.lower(root.get("adUnitId")), searchPattern),
//                     cb.like(cb.lower(root.get("mobileAppResolvedId")), searchPattern)
//             ));
//         }
//         return predicates;
//     }

//     // Method to get paginated and filtered report data
//     public Page<AdReportData> getReportData(ReportQueryRequest queryRequest) {
//         logger.debug("Fetching report data with query: {}", queryRequest);

//         Sort sort = Sort.unsorted();
//         if (queryRequest.getSortBy() != null && queryRequest.getSortOrder() != null) {
//             Sort.Direction direction = queryRequest.getSortOrder().equalsIgnoreCase("DESC") ? Sort.Direction.DESC : Sort.Direction.ASC;
//             sort = Sort.by(direction, queryRequest.getSortBy());
//         }

//         // Adjust page to be 0-indexed for Spring Data JPA (frontend sends 1-indexed)
//         Pageable pageable = PageRequest.of(queryRequest.getPage() - 1, queryRequest.getSize(), sort);

//         // Create a Specification using the buildPredicates helper
//         Specification<AdReportData> spec = (root, query, criteriaBuilder) -> {
//             List<Predicate> predicates = buildPredicates(queryRequest, criteriaBuilder, root);
//             return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
//         };

//         return adReportDataRepository.findAll(spec, pageable);
//     }

//     // Method to get aggregated report data (now performs database-level aggregation)
//     public List<Map<String, Object>> getAggregatedReportData(ReportQueryRequest queryRequest) {
//         logger.debug("Fetching aggregated report data with query: {}", queryRequest);

//         CriteriaBuilder cb = entityManager.getCriteriaBuilder();
//         CriteriaQuery<Tuple> cq = cb.createTupleQuery(); // Use Tuple to select multiple columns (dimensions + aggregates)
//         Root<AdReportData> root = cq.from(AdReportData.class);

//         // Apply filters (WHERE clause)
//         List<Predicate> predicates = buildPredicates(queryRequest, cb, root);
//         if (!predicates.isEmpty()) {
//             cq.where(cb.and(predicates.toArray(new Predicate[0])));
//         }

//         // Dynamic selections (dimensions and aggregated metrics)
//         List<Selection<?>> selections = new ArrayList<>();
//         List<Expression<?>> groupByExpressions = new ArrayList<>();

//         // Add dimensions to selections and group by expressions
//         if (queryRequest.getGroupByDimensions() != null && !queryRequest.getGroupByDimensions().isEmpty()) {
//             for (String dim : queryRequest.getGroupByDimensions()) {
//                 Expression<?> dimPath = root.get(dim);
//                 selections.add(dimPath.alias(dim)); // Alias is important for mapping to Map keys
//                 groupByExpressions.add(dimPath);
//             }
//         }

//         // Add aggregated metrics to selections
//         List<String> metricsToAggregate = queryRequest.getMetrics();
//         if (metricsToAggregate == null || metricsToAggregate.isEmpty()) {
//             // If no specific metrics requested, aggregate all default metrics for summary
//             metricsToAggregate = getAvailableMetrics();
//         }

//         for (String metric : metricsToAggregate) {
//             // Ensure the path is for a Number type for aggregation functions
//             Expression<Number> metricPath = root.get(metric);
//             switch (metric) {
//                 // Metrics that are sums (e.g., total counts, payout)
//                 case "adExchangeTotalRequests":
//                 case "adExchangeResponsesServed":
//                 case "adExchangeLineItemLevelImpressions":
//                 case "adExchangeLineItemLevelClicks":
//                 case "payout":
//                     selections.add(cb.sum(metricPath).alias(metric));
//                     break;
//                 // Metrics that are averages (e.g., rates, eCPM)
//                 case "adExchangeMatchRate":
//                 case "adExchangeLineItemLevelCtr":
//                 case "averageEcpm":
//                     selections.add(cb.avg(metricPath).alias(metric));
//                     break;
//                 default:
//                     logger.warn("Metric '{}' is not configured for aggregation. Skipping.", metric);
//                     // Optionally, you could add the raw metric if it's not meant to be aggregated
//                     // selections.add(root.get(metric).alias(metric));
//                     break;
//             }
//         }

//         // Set selections for the query
//         cq.multiselect(selections.toArray(new Selection[0]));

//         // Apply group by clause if dimensions are present
//         if (!groupByExpressions.isEmpty()) {
//             cq.groupBy(groupByExpressions.toArray(new Expression[0]));
//         }

//         // Execute the query
//         TypedQuery<Tuple> typedQuery = entityManager.createQuery(cq);
//         List<Tuple> results = typedQuery.getResultList();

//         // Map Tuple results to List<Map<String, Object>>
//         List<Map<String, Object>> mappedResults = new ArrayList<>();
//         for (Tuple tuple : results) {
//             Map<String, Object> row = new LinkedHashMap<>(); // Use LinkedHashMap to preserve order of selections
//             for (Selection<?> selection : selections) {
//                 String alias = selection.getAlias();
//                 Object value = tuple.get(alias);
//                 // Special handling for date dimension if present
//                 if ("date".equals(alias) && value instanceof LocalDate) {
//                     row.put(alias, ((LocalDate) value).format(DateTimeFormatter.ISO_LOCAL_DATE));
//                 } else {
//                     row.put(alias, value);
//                 }
//             }
//             mappedResults.add(row);
//         }

//         return mappedResults;
//     }

//     private String capitalize(String str) {
//         if (str == null || str.isEmpty()) {
//             return str;
//         }
//         return str.substring(0, 1).toUpperCase() + str.substring(1);
//     }

//     // Method to export report data to CSV (remains largely the same, but uses the shared buildPredicates)
//     public void exportReport(ReportQueryRequest queryRequest, PrintWriter writer) {
//         logger.debug("Exporting report data with query: {}", queryRequest);

//         // Create a Specification using the buildPredicates helper
//         Specification<AdReportData> spec = (root, query, criteriaBuilder) -> {
//             List<Predicate> predicates = buildPredicates(queryRequest, criteriaBuilder, root);
//             return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
//         };

//         // Fetch all data matching the filters for export
//         List<AdReportData> dataToExport = adReportDataRepository.findAll(spec);

//         if (dataToExport.isEmpty()) {
//             writer.println("No data available for the selected filters.");
//             return;
//         }

//         // Determine columns dynamically from the first data object or from selected dimensions/metrics
//         Set<String> headers = new LinkedHashSet<>();
//         headers.add("S.No."); // Add serial number header
//         if (queryRequest.getGroupByDimensions() != null && !queryRequest.getGroupByDimensions().isEmpty()) {
//             headers.addAll(queryRequest.getGroupByDimensions());
//         } else {
//             // If no group by, include all default dimensions
//             headers.add("mobileAppResolvedId");
//             headers.add("mobileAppName");
//             headers.add("domain");
//             headers.add("adUnitName");
//             headers.add("adUnitId");
//             headers.add("inventoryFormatName");
//             headers.add("operatingSystemVersionName");
//             headers.add("date");
//         }

//         if (queryRequest.getMetrics() != null && !queryRequest.getMetrics().isEmpty()) {
//             headers.addAll(queryRequest.getMetrics());
//         } else {
//             // If no metrics, include all default metrics
//             headers.add("adExchangeTotalRequests");
//             headers.add("adExchangeResponsesServed");
//             headers.add("adExchangeMatchRate");
//             headers.add("adExchangeLineItemLevelImpressions");
//             headers.add("adExchangeLineItemLevelClicks");
//             headers.add("adExchangeLineItemLevelCtr");
//             headers.add("averageEcpm");
//             headers.add("payout");
//         }

//         // Write header row
//         writer.println(headers.stream()
//                 .map(this::formatHeader)
//                 .collect(Collectors.joining(",")));

//         // Write data rows
//         int serialNumber = 1;
//         for (AdReportData data : dataToExport) {
//             List<String> rowValues = new ArrayList<>();
//             rowValues.add(String.valueOf(serialNumber++)); // Add serial number

//             for (String header : headers) {
//                 if ("S.No.".equals(header)) continue; // Skip S.No. as it's handled separately

//                 try {
//                     // Use reflection to get the value for each header
//                     String getterMethodName = "get" + capitalize(header);
//                     Object value = AdReportData.class.getMethod(getterMethodName).invoke(data);

//                     // Format specific fields
//                     if (value instanceof LocalDate) {
//                         rowValues.add(((LocalDate) value).format(DateTimeFormatter.ISO_LOCAL_DATE));
//                     } else if (value instanceof Double) {
//                         // Format doubles to 2 decimal places if they are metrics that usually have decimals
//                         if (header.toLowerCase().contains("ecpm") || header.toLowerCase().contains("payout") ||
//                             header.toLowerCase().contains("ctr") || header.toLowerCase().contains("rate")) {
//                             rowValues.add(String.format(Locale.US, "%.2f", value));
//                         } else {
//                             rowValues.add(value.toString());
//                         }
//                     } else if (value != null) {
//                         // Escape commas and quotes for CSV
//                         String stringValue = value.toString();
//                         if (stringValue.contains(",") || stringValue.contains("\"") || stringValue.contains("\n")) {
//                             rowValues.add("\"" + stringValue.replace("\"", "\"\"") + "\"");
//                         } else {
//                             rowValues.add(stringValue);
//                         }
//                     } else {
//                         rowValues.add(""); // Handle null values
//                     }
//                 } catch (NoSuchMethodException e) {
//                     logger.warn("No getter found for property {} in AdReportData. Skipping this column for export.", header);
//                     rowValues.add(""); // Add empty string if getter not found
//                 } catch (Exception e) {
//                     logger.error("Error getting value for header {} from AdReportData: {}", header, e.getMessage());
//                     rowValues.add(""); // Add empty string on error
//                 }
//             }
//             writer.println(String.join(",", rowValues));
//         }
//     }

//     private String formatHeader(String header) {
//         // Convert camelCase to "Title Case" for display
//         String formatted = header.replaceAll("([A-Z])", " $1").trim();
//         return formatted.substring(0, 1).toUpperCase() + formatted.substring(1);
//     }

//     // Existing methods for available dimensions and metrics
//     public List<String> getAvailableDimensions() {
//         return Arrays.asList(
//             "mobileAppResolvedId", "mobileAppName", "domain", "adUnitName", "adUnitId",
//             "inventoryFormatName", "operatingSystemVersionName", "date"
//         );
//     }

//     public List<String> getAvailableMetrics() {
//         return Arrays.asList(
//             "adExchangeTotalRequests", "adExchangeResponsesServed", "adExchangeMatchRate",
//             "adExchangeLineItemLevelImpressions", "adExchangeLineItemLevelClicks",
//             "adExchangeLineItemLevelCtr", "averageEcpm", "payout"
//         );
//     }

//     // New methods to fetch distinct values (remain unchanged)
//     public List<String> getDistinctMobileAppNames() {
//         return adReportDataRepository.findDistinctMobileAppName();
//     }

//     public List<String> getDistinctInventoryFormatNames() {
//         return adReportDataRepository.findDistinctInventoryFormatName();
//     }

//     public List<String> getDistinctOperatingSystemVersionNames() {
//         return adReportDataRepository.findDistinctOperatingSystemVersionName();
//     }
// }

// package com.adtech.reportingsystem.service;

// import com.adtech.reportingsystem.model.AdReportData;
// import com.adtech.reportingsystem.repository.AdReportDataRepository;
// import com.opencsv.CSVReader;
// import com.opencsv.exceptions.CsvValidationException;
// import jakarta.annotation.PreDestroy;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;
// import org.springframework.transaction.PlatformTransactionManager;
// import org.springframework.transaction.TransactionStatus;
// import org.springframework.transaction.support.DefaultTransactionDefinition;
// import org.springframework.web.multipart.MultipartFile;
// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;

// import java.io.BufferedReader;
// import java.io.IOException;
// import java.io.InputStreamReader;
// import java.time.LocalDate;
// import java.time.format.DateTimeParseException;
// import java.util.ArrayList;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;
// import java.util.concurrent.ConcurrentHashMap;
// import java.util.concurrent.ExecutorService;
// import java.util.concurrent.Executors;
// import java.util.concurrent.TimeUnit;
// import java.util.concurrent.atomic.AtomicLong;

// @Service
// public class CsvImportService {

//     private static final Logger logger = LoggerFactory.getLogger(CsvImportService.class);

//     @Autowired
//     private AdReportDataRepository adReportDataRepository;

//     @Autowired
//     private PlatformTransactionManager transactionManager;

//     private final ExecutorService executorService = Executors.newFixedThreadPool(5);
//     private final AtomicLong importJobCounter = new AtomicLong();
//     private final ConcurrentHashMap<Long, String> importStatusMap = new ConcurrentHashMap<>();

//     private static final Map<String, String> HEADER_MAPPING = new HashMap<>();
//     static {
//         HEADER_MAPPING.put("App ID", "mobile_app_resolved_id");
//         HEADER_MAPPING.put("App Name", "mobile_app_name");
//         HEADER_MAPPING.put("Domain", "domain");
//         HEADER_MAPPING.put("Ad Unit", "ad_unit_name");
//         HEADER_MAPPING.put("Ad Unit ID", "ad_unit_id");
//         HEADER_MAPPING.put("Inventory Format", "inventory_format_name");
//         HEADER_MAPPING.put("OS Version", "operating_system_version_name");
//         HEADER_MAPPING.put("Date", "date");
//         HEADER_MAPPING.put("Total Requests", "ad_exchange_total_requests");
//         HEADER_MAPPING.put("Responses Served", "ad_exchange_responses_served");
//         HEADER_MAPPING.put("Match Rate", "ad_exchange_match_rate");
//         HEADER_MAPPING.put("Impressions", "ad_exchange_line_item_level_impressions");
//         HEADER_MAPPING.put("Clicks", "ad_exchange_line_item_level_clicks");
//         HEADER_MAPPING.put("CTR", "ad_exchange_line_item_level_ctr");
//         HEADER_MAPPING.put("Average eCPM", "average_ecpm");
//         HEADER_MAPPING.put("Payout", "payout");
//     }

//     public Long importCsvData(MultipartFile file) throws IOException {
//         long jobId = importJobCounter.incrementAndGet();
//         importStatusMap.put(jobId, "IN_PROGRESS");
//         logger.info("Import job {} initiated. Status: IN_PROGRESS.", jobId);

//         byte[] fileBytes = file.getBytes();
//         String originalFilename = file.getOriginalFilename();

//         executorService.submit(() -> {
//             TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition());
//             try (BufferedReader reader = new BufferedReader(new InputStreamReader(new java.io.ByteArrayInputStream(fileBytes)));
//                  CSVReader csvReader = new CSVReader(reader)) {

//                 String[] header = csvReader.readNext();
//                 if (header == null || header.length == 0) {
//                     importStatusMap.put(jobId, "FAILED: Empty file or no header.");
//                     logger.warn("Import job {} FAILED: Empty file or no header. Filename: {}", jobId, originalFilename);
//                     transactionManager.rollback(status);
//                     return;
//                 }

//                 String[] mappedHeader = new String[header.length];
//                 for (int i = 0; i < header.length; i++) {
//                     String trimmedHeader = header[i].trim();
//                     mappedHeader[i] = HEADER_MAPPING.getOrDefault(trimmedHeader, trimmedHeader);
//                 }

//                 List<String> expectedHeaders = List.of("mobile_app_resolved_id", "mobile_app_name", "domain",
//                         "ad_unit_name", "ad_unit_id", "inventory_format_name", "operating_system_version_name", "date",
//                         "ad_exchange_total_requests", "ad_exchange_responses_served", "ad_exchange_match_rate",
//                         "ad_exchange_line_item_level_impressions", "ad_exchange_line_item_level_clicks",
//                         "ad_exchange_line_item_level_ctr", "average_ecpm", "payout");

//                 if (!List.of(mappedHeader).containsAll(expectedHeaders)) {
//                     importStatusMap.put(jobId, "FAILED: CSV header mismatch. Expected: " + expectedHeaders);
//                     logger.error("Import job {} FAILED: CSV header mismatch. Expected: {}. Found (after mapping): {}", jobId, expectedHeaders, List.of(mappedHeader));
//                     transactionManager.rollback(status);
//                     return;
//                 }

//                 String[] line;
//                 List<AdReportData> batch = new ArrayList<>();
//                 final int BATCH_SIZE = 5000;

//                 long processedRecords = 0;
//                 long errorRecords = 0;

//                 while ((line = csvReader.readNext()) != null) {
//                     try {
//                         AdReportData data = parseCsvLine(line, mappedHeader);
//                         batch.add(data);
//                         if (batch.size() >= BATCH_SIZE) {
//                             adReportDataRepository.saveAll(batch);
//                             batch.clear();
//                             logger.debug("Import job {}: Saved a batch of {} records. Total processed: {}", jobId, BATCH_SIZE, processedRecords + BATCH_SIZE);
//                         }
//                         processedRecords++;
//                     } catch (Exception e) {
//                         logger.error("Import job {}: Error parsing CSV line: {} - {}", jobId, String.join(",", line), e.getMessage(), e);
//                         errorRecords++;
//                     }
//                 }
//                 if (!batch.isEmpty()) {
//                     adReportDataRepository.saveAll(batch);
//                     logger.debug("Import job {}: Saved final batch of {} records. Total processed: {}", jobId, batch.size(), processedRecords);
//                 }

//                 importStatusMap.put(jobId, String.format("COMPLETED: Processed %d records, %d errors.", processedRecords, errorRecords));
//                 logger.info("Import job {} COMPLETED. Processed {} records, {} errors.", jobId, processedRecords, errorRecords);
//                 transactionManager.commit(status);

//             } catch (CsvValidationException e) {
//                 importStatusMap.put(jobId, "FAILED: CSV format validation error - " + e.getMessage());
//                 logger.error("Import job {} FAILED: CSV validation error: {}", jobId, e.getMessage(), e);
//                 transactionManager.rollback(status);
//             } catch (IOException e) {
//                 importStatusMap.put(jobId, "FAILED: I/O error during file processing - " + e.getMessage());
//                 logger.error("Import job {} FAILED: I/O error: {}", jobId, e.getMessage(), e);
//                 transactionManager.rollback(status);
//             } catch (Exception e) {
//                 importStatusMap.put(jobId, "FAILED: An unexpected error occurred - " + e.getMessage());
//                 logger.error("Import job {} FAILED: An unexpected error occurred: {}", jobId, e.getMessage(), e);
//                 transactionManager.rollback(status);
//             }
//         });

//         return jobId;
//     }

//     public String getImportStatus(Long jobId) {
//         return importStatusMap.getOrDefault(jobId, "NOT_FOUND");
//     }

//     private AdReportData parseCsvLine(String[] line, String[] mappedHeader) {
//         AdReportData data = new AdReportData();
//         for (int i = 0; i < mappedHeader.length; i++) {
//             String colName = mappedHeader[i].trim();
//             String value = line[i].trim();

//             if (value.isEmpty() || value.isBlank() || value.equalsIgnoreCase("null") || value.equalsIgnoreCase("N/A")) {
//                 continue;
//             }

//             try {
//                 switch (colName) {
//                     case "mobile_app_resolved_id":
//                     case "mobile_app_name":
//                     case "domain":
//                     case "ad_unit_name":
//                     case "ad_unit_id":
//                     case "inventory_format_name":
//                     case "operating_system_version_name":
//                         switch (colName) {
//                              case "mobile_app_resolved_id": data.setMobileAppResolvedId(value); break;
//                              case "mobile_app_name": data.setMobileAppName(value); break;
//                              case "domain": data.setDomain(value); break;
//                              case "ad_unit_name": data.setAdUnitName(value); break;
//                              case "ad_unit_id": data.setAdUnitId(value); break;
//                              case "inventory_format_name": data.setInventoryFormatName(value); break;
//                              case "operating_system_version_name": data.setOperatingSystemVersionName(value); break;
//                         }
//                         break;
//                     case "date":
//                         data.setDate(LocalDate.parse(value));
//                         break;
//                     case "ad_exchange_total_requests":
//                         data.setAdExchangeTotalRequests((long) Double.parseDouble(value));
//                         break;
//                     case "ad_exchange_responses_served":
//                         data.setAdExchangeResponsesServed((long) Double.parseDouble(value));
//                         break;
//                     case "ad_exchange_match_rate":
//                         data.setAdExchangeMatchRate(Double.parseDouble(value));
//                         break;
//                     case "ad_exchange_line_item_level_impressions":
//                         data.setAdExchangeLineItemLevelImpressions((long) Double.parseDouble(value));
//                         break;
//                     case "ad_exchange_line_item_level_clicks":
//                         data.setAdExchangeLineItemLevelClicks((long) Double.parseDouble(value));
//                         break;
//                     case "ad_exchange_line_item_level_ctr":
//                         data.setAdExchangeLineItemLevelCtr(Double.parseDouble(value));
//                         break;
//                     case "average_ecpm":
//                         data.setAverageEcpm(Double.parseDouble(value));
//                         break;
//                     case "payout":
//                         data.setPayout(Double.parseDouble(value));
//                         break;
//                     default:
//                         logger.warn("Encountered unexpected column '{}' with value '{}'. Skipping.", colName, value);
//                         break;
//                 }
//             } catch (NumberFormatException | DateTimeParseException e) {
//                 logger.error("Data type mismatch error. Column '{}' with value '{}' in line {}: {}",
//                         colName, value, String.join(",", line), e.getMessage(), e);
//                 throw new IllegalArgumentException("Data type mismatch for column '" + colName + "' with value '" + value + "': " + e.getMessage(), e);
//             }
//         }
//         return data;
//     }

//     @PreDestroy
//     public void shutdownExecutor() {
//         logger.info("Shutting down CSV import executor service.");
//         executorService.shutdown();
//         try {
//             if (!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
//                 executorService.shutdownNow();
//                 logger.warn("CSV import executor service did not terminate in time, forcing shutdown.");
//             }
//         } catch (InterruptedException e) {
//             executorService.shutdownNow();
//             Thread.currentThread().interrupt();
//             logger.warn("CSV import executor service shutdown interrupted, forcing shutdown.");
//         }
//     }
// }

package com.adtech.reportingsystem.service;

import com.adtech.reportingsystem.model.AdReportData;
import com.adtech.reportingsystem.repository.AdReportDataRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async; // Import for @Async
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Import for @Transactional
import org.springframework.web.multipart.MultipartFile; // <--- ADDED THIS IMPORT

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class CsvImportService {

    private static final Logger logger = LoggerFactory.getLogger(CsvImportService.class);

    @Autowired
    private AdReportDataRepository adReportDataRepository;

    // Remove direct PlatformTransactionManager injection if using @Transactional
    // @Autowired
    // private PlatformTransactionManager transactionManager; 

    private final ExecutorService executorService = Executors.newFixedThreadPool(5);
    private final AtomicLong importJobCounter = new AtomicLong();
    private final ConcurrentHashMap<Long, String> importStatusMap = new ConcurrentHashMap<>();

    private static final Map<String, String> HEADER_MAPPING = new HashMap<>();
    static {
        HEADER_MAPPING.put("App ID", "mobile_app_resolved_id");
        HEADER_MAPPING.put("App Name", "mobile_app_name");
        HEADER_MAPPING.put("Domain", "domain");
        HEADER_MAPPING.put("Ad Unit", "ad_unit_name");
        HEADER_MAPPING.put("Ad Unit ID", "ad_unit_id");
        HEADER_MAPPING.put("Inventory Format", "inventory_format_name");
        HEADER_MAPPING.put("OS Version", "operating_system_version_name");
        HEADER_MAPPING.put("Date", "date");
        HEADER_MAPPING.put("Total Requests", "ad_exchange_total_requests");
        HEADER_MAPPING.put("Responses Served", "ad_exchange_responses_served");
        HEADER_MAPPING.put("Match Rate", "ad_exchange_match_rate");
        HEADER_MAPPING.put("Impressions", "ad_exchange_line_item_level_impressions");
        HEADER_MAPPING.put("Clicks", "ad_exchange_line_item_level_clicks");
        HEADER_MAPPING.put("CTR", "ad_exchange_line_item_level_ctr");
        HEADER_MAPPING.put("Average eCPM", "average_ecpm");
        HEADER_MAPPING.put("Payout", "payout");
    }

    public Long importCsvData(MultipartFile file) throws IOException {
        long jobId = importJobCounter.incrementAndGet();
        importStatusMap.put(jobId, "IN_PROGRESS");
        logger.info("Import job {} initiated. Status: IN_PROGRESS.", jobId);

        byte[] fileBytes = file.getBytes();
        String originalFilename = file.getOriginalFilename();

        // Submit the actual processing to the async method
        executorService.submit(() -> processCsvFileAsync(fileBytes, originalFilename, jobId));

        return jobId;
    }

    /**
     * This method performs the actual CSV parsing and database saving.
     * It is marked @Async to run in a separate thread and @Transactional
     * to ensure a new transaction and EntityManager are opened for this thread's work.
     */
    @Async("csvImportTaskExecutor") // Ensure you have a TaskExecutor named 'csvImportTaskExecutor' configured
    @Transactional // This will manage the transaction for this async method
    protected void processCsvFileAsync(byte[] fileBytes, String originalFilename, long jobId) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new java.io.ByteArrayInputStream(fileBytes)));
             CSVReader csvReader = new CSVReader(reader)) {

            String[] header = csvReader.readNext();
            if (header == null || header.length == 0) {
                importStatusMap.put(jobId, "FAILED: Empty file or no header.");
                logger.warn("Import job {} FAILED: Empty file or no header. Filename: {}", jobId, originalFilename);
                return;
            }

            String[] mappedHeader = new String[header.length];
            for (int i = 0; i < header.length; i++) {
                String trimmedHeader = header[i].trim();
                mappedHeader[i] = HEADER_MAPPING.getOrDefault(trimmedHeader, trimmedHeader);
            }

            List<String> expectedHeaders = List.of("mobile_app_resolved_id", "mobile_app_name", "domain",
                    "ad_unit_name", "ad_unit_id", "inventory_format_name", "operating_system_version_name", "date",
                    "ad_exchange_total_requests", "ad_exchange_responses_served", "ad_exchange_match_rate",
                    "ad_exchange_line_item_level_impressions", "ad_exchange_line_item_level_clicks",
                    "ad_exchange_line_item_level_ctr", "average_ecpm", "payout");

            if (!List.of(mappedHeader).containsAll(expectedHeaders)) {
                importStatusMap.put(jobId, "FAILED: CSV header mismatch. Expected: " + expectedHeaders);
                logger.error("Import job {} FAILED: CSV header mismatch. Expected: {}. Found (after mapping): {}", jobId, expectedHeaders, List.of(mappedHeader));
                return;
            }

            String[] line;
            List<AdReportData> batch = new ArrayList<>();
            final int BATCH_SIZE = 5000;

            long processedRecords = 0;
            long errorRecords = 0;

            while ((line = csvReader.readNext()) != null) {
                try {
                    AdReportData data = parseCsvLine(line, mappedHeader);
                    batch.add(data);
                    if (batch.size() >= BATCH_SIZE) {
                        adReportDataRepository.saveAll(batch);
                        batch.clear();
                        logger.debug("Import job {}: Saved a batch of {} records. Total processed: {}", jobId, BATCH_SIZE, processedRecords + BATCH_SIZE);
                    }
                    processedRecords++;
                } catch (Exception e) {
                    logger.error("Import job {}: Error parsing CSV line: {} - {}", jobId, String.join(",", line), e.getMessage(), e);
                    errorRecords++;
                }
            }
            if (!batch.isEmpty()) {
                adReportDataRepository.saveAll(batch);
                logger.debug("Import job {}: Saved final batch of {} records. Total processed: {}", jobId, batch.size(), processedRecords);
            }

            importStatusMap.put(jobId, String.format("COMPLETED: Processed %d records, %d errors.", processedRecords, errorRecords));
            logger.info("Import job {} COMPLETED. Processed {} records, {} errors.", jobId, processedRecords, errorRecords);

        } catch (CsvValidationException e) {
            importStatusMap.put(jobId, "FAILED: CSV format validation error - " + e.getMessage());
            logger.error("Import job {} FAILED: CSV validation error: {}", jobId, e.getMessage(), e);
        } catch (IOException e) {
            importStatusMap.put(jobId, "FAILED: I/O error during file processing - " + e.getMessage());
            logger.error("Import job {} FAILED: I/O error: {}", jobId, e.getMessage(), e);
        } catch (Exception e) {
            importStatusMap.put(jobId, "FAILED: An unexpected error occurred - " + e.getMessage());
            logger.error("Import job {} FAILED: An unexpected error occurred: {}", jobId, e.getMessage(), e);
        }
        // @Transactional will handle commit/rollback automatically based on exceptions
    }

    public String getImportStatus(Long jobId) {
        return importStatusMap.getOrDefault(jobId, "NOT_FOUND");
    }

    private AdReportData parseCsvLine(String[] line, String[] mappedHeader) {
        AdReportData data = new AdReportData();
        for (int i = 0; i < mappedHeader.length; i++) {
            String colName = mappedHeader[i].trim();
            String value = line[i].trim();

            if (value.isEmpty() || value.isBlank() || value.equalsIgnoreCase("null") || value.equalsIgnoreCase("N/A")) {
                continue;
            }

            try {
                switch (colName) {
                    case "mobile_app_resolved_id":
                    case "mobile_app_name":
                    case "domain":
                    case "ad_unit_name":
                    case "ad_unit_id":
                    case "inventory_format_name":
                    case "operating_system_version_name":
                        switch (colName) {
                            case "mobile_app_resolved_id": data.setMobileAppResolvedId(value); break;
                            case "mobile_app_name": data.setMobileAppName(value); break;
                            case "domain": data.setDomain(value); break;
                            case "ad_unit_name": data.setAdUnitName(value); break;
                            case "ad_unit_id": data.setAdUnitId(value); break;
                            case "inventory_format_name": data.setInventoryFormatName(value); break;
                            case "operating_system_version_name": data.setOperatingSystemVersionName(value); break;
                        }
                        break;
                    case "date":
                        data.setDate(LocalDate.parse(value));
                        break;
                    case "ad_exchange_total_requests":
                        data.setAdExchangeTotalRequests((long) Double.parseDouble(value));
                        break;
                    case "ad_exchange_responses_served":
                        data.setAdExchangeResponsesServed((long) Double.parseDouble(value));
                        break;
                    case "ad_exchange_match_rate":
                        data.setAdExchangeMatchRate(Double.parseDouble(value));
                        break;
                    case "ad_exchange_line_item_level_impressions":
                        data.setAdExchangeLineItemLevelImpressions((long) Double.parseDouble(value));
                        break;
                    case "ad_exchange_line_item_level_clicks":
                        data.setAdExchangeLineItemLevelClicks((long) Double.parseDouble(value));
                        break;
                    case "ad_exchange_line_item_level_ctr":
                        data.setAdExchangeLineItemLevelCtr(Double.parseDouble(value));
                        break;
                    case "average_ecpm":
                        data.setAverageEcpm(Double.parseDouble(value));
                        break;
                    case "payout":
                        data.setPayout(Double.parseDouble(value));
                        break;
                    default:
                        logger.warn("Encountered unexpected column '{}' with value '{}'. Skipping.", colName, value);
                        break;
                }
            } catch (NumberFormatException | DateTimeParseException e) {
                logger.error("Data type mismatch error. Column '{}' with value '{}' in line {}: {}",
                        colName, value, String.join(",", line), e.getMessage(), e);
                throw new IllegalArgumentException("Data type mismatch for column '" + colName + "' with value '" + value + "': " + e.getMessage(), e);
            }
        }
        return data;
    }

    @PreDestroy
    public void shutdownExecutor() {
        logger.info("Shutting down CSV import executor service.");
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
                logger.warn("CSV import executor service did not terminate in time, forcing shutdown.");
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
            logger.warn("CSV import executor service shutdown interrupted, forcing shutdown.");
        }
    }
}

