package com.adtech.reportingsystem.service;

import com.adtech.reportingsystem.model.AdReportData;
import com.adtech.reportingsystem.repository.AdReportDataRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

    @Autowired
    private PlatformTransactionManager transactionManager;

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

        executorService.submit(() -> {
            TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition());
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(new java.io.ByteArrayInputStream(fileBytes)));
                 CSVReader csvReader = new CSVReader(reader)) {

                String[] header = csvReader.readNext();
                if (header == null || header.length == 0) {
                    importStatusMap.put(jobId, "FAILED: Empty file or no header.");
                    logger.warn("Import job {} FAILED: Empty file or no header. Filename: {}", jobId, originalFilename);
                    transactionManager.rollback(status);
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
                    transactionManager.rollback(status);
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
                transactionManager.commit(status);

            } catch (CsvValidationException e) {
                importStatusMap.put(jobId, "FAILED: CSV format validation error - " + e.getMessage());
                logger.error("Import job {} FAILED: CSV validation error: {}", jobId, e.getMessage(), e);
                transactionManager.rollback(status);
            } catch (IOException e) {
                importStatusMap.put(jobId, "FAILED: I/O error during file processing - " + e.getMessage());
                logger.error("Import job {} FAILED: I/O error: {}", jobId, e.getMessage(), e);
                transactionManager.rollback(status);
            } catch (Exception e) {
                importStatusMap.put(jobId, "FAILED: An unexpected error occurred - " + e.getMessage());
                logger.error("Import job {} FAILED: An unexpected error occurred: {}", jobId, e.getMessage(), e);
                transactionManager.rollback(status);
            }
        });

        return jobId;
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

