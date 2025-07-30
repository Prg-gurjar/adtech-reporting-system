// package com.adtech.reportingsystem.service;

// import com.adtech.reportingsystem.model.AdReportData;
// import com.adtech.reportingsystem.repository.AdReportDataRepository;
// import com.opencsv.CSVReader;
// import com.opencsv.exceptions.CsvValidationException;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional;
// import org.springframework.web.multipart.MultipartFile;

// import java.io.BufferedReader;
// import java.io.IOException;
// import java.io.InputStreamReader;
// import java.time.LocalDate;
// import java.time.format.DateTimeParseException;
// import java.util.ArrayList;
// import java.util.List;
// import java.util.concurrent.ExecutorService;
// import java.util.concurrent.Executors;

// import java.util.concurrent.atomic.AtomicLong;

// @Service
// public class CsvImportService {

//     @Autowired
//     private AdReportDataRepository adReportDataRepository;

//     private final ExecutorService executorService = Executors.newFixedThreadPool(5); 
//     private final AtomicLong importJobCounter = new AtomicLong();
//     private final java.util.Map<Long, String> importStatusMap = new java.util.concurrent.ConcurrentHashMap<>();

//     @Transactional
//     public Long importCsvData(MultipartFile file) throws IOException {
//         long jobId = importJobCounter.incrementAndGet();
//         importStatusMap.put(jobId, "IN_PROGRESS");

//         executorService.submit(() -> {
//             try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
//                  CSVReader csvReader = new CSVReader(reader)) {

//                 String[] header = csvReader.readNext();
//                 if (header == null || header.length == 0) {
//                     importStatusMap.put(jobId, "FAILED: Empty file or no header.");
//                     return;
//                 }

//                 List<String> expectedHeaders = List.of("mobile_app_resolved_id", "mobile_app_name", "domain",
//                         "ad_unit_name", "ad_unit_id", "inventory_format_name", "operating_system_version_name", "date",
//                         "ad_exchange_total_requests", "ad_exchange_responses_served", "ad_exchange_match_rate",
//                         "ad_exchange_line_item_level_impressions", "ad_exchange_line_item_level_clicks",
//                         "ad_exchange_line_item_level_ctr", "average_ecpm", "payout");

//                 if (!List.of(header).containsAll(expectedHeaders)) {
//                     importStatusMap.put(jobId, "FAILED: CSV header mismatch. Expected: " + expectedHeaders);
//                     return;
//                 }


//                 String[] line;
//                 List<AdReportData> batch = new ArrayList<>();
//                 final int BATCH_SIZE = 5000; 

//                 long processedRecords = 0;
//                 long errorRecords = 0;

//                 while ((line = csvReader.readNext()) != null) {
//                     try {
//                         AdReportData data = parseCsvLine(line, header);
//                         batch.add(data);
//                         if (batch.size() >= BATCH_SIZE) {
//                             adReportDataRepository.saveAll(batch);
//                             batch.clear();
//                         }
//                         processedRecords++;
//                     } catch (Exception e) {
//                         System.err.println("Error parsing CSV line: " + String.join(",", line) + " - " + e.getMessage());
//                         errorRecords++;
                        
//                     }
//                 }
//                 if (!batch.isEmpty()) {
//                     adReportDataRepository.saveAll(batch); 
//                 }
//                 importStatusMap.put(jobId, String.format("COMPLETED: Processed %d records, %d errors.", processedRecords, errorRecords));

//             } catch (CsvValidationException e) {
//                 importStatusMap.put(jobId, "FAILED: CSV format validation error - " + e.getMessage());
//                 System.err.println("CSV validation error for job " + jobId + ": " + e.getMessage());
//             } catch (IOException e) {
//                 importStatusMap.put(jobId, "FAILED: I/O error during file processing - " + e.getMessage());
//                 System.err.println("I/O error for job " + jobId + ": " + e.getMessage());
//             } catch (Exception e) {
//                 importStatusMap.put(jobId, "FAILED: An unexpected error occurred - " + e.getMessage());
//                 System.err.println("Unexpected error for job " + jobId + ": " + e.getMessage());
//             }
//         });

//         return jobId;
//     }

//     public String getImportStatus(Long jobId) {
//         return importStatusMap.getOrDefault(jobId, "NOT_FOUND");
//     }

//     private AdReportData parseCsvLine(String[] line, String[] header) {
//         AdReportData data = new AdReportData();
//         for (int i = 0; i < header.length; i++) {
//             String colName = header[i].trim();
//             String value = line[i].trim();

//             try {
//                 switch (colName) {
//                     case "mobile_app_resolved_id":
//                         data.setMobileAppResolvedId(value);
//                         break;
//                     case "mobile_app_name":
//                         data.setMobileAppName(value);
//                         break;
//                     case "domain":
//                         data.setDomain(value);
//                         break;
//                     case "ad_unit_name":
//                         data.setAdUnitName(value);
//                         break;
//                     case "ad_unit_id":
//                         data.setAdUnitId(value);
//                         break;
//                     case "inventory_format_name":
//                         data.setInventoryFormatName(value);
//                         break;
//                     case "operating_system_version_name":
//                         data.setOperatingSystemVersionName(value);
//                         break;
//                     case "date":
//                         data.setDate(LocalDate.parse(value)); 
//                         break;
//                     case "ad_exchange_total_requests":
//                         data.setAdExchangeTotalRequests(Long.parseLong(value));
//                         break;
//                     case "ad_exchange_responses_served":
//                         data.setAdExchangeResponsesServed(Long.parseLong(value));
//                         break;
//                     case "ad_exchange_match_rate":
//                         data.setAdExchangeMatchRate(Double.parseDouble(value));
//                         break;
//                     case "ad_exchange_line_item_level_impressions":
//                         data.setAdExchangeLineItemLevelImpressions(Long.parseLong(value));
//                         break;
//                     case "ad_exchange_line_item_level_clicks":
//                         data.setAdExchangeLineItemLevelClicks(Long.parseLong(value));
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
//                         break;
//                 }
//             } catch (NumberFormatException | DateTimeParseException e) {
//                 throw new IllegalArgumentException("Data type mismatch for column '" + colName + "' with value '" + value + "': " + e.getMessage(), e);
//             }
//         }
//         return data;
//     }
// }



package com.adtech.reportingsystem.service;

import com.adtech.reportingsystem.model.AdReportData;
import com.adtech.reportingsystem.repository.AdReportDataRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager; // Import this
import org.springframework.transaction.TransactionStatus;          // Import this
import org.springframework.transaction.support.DefaultTransactionDefinition; // Import this
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger; // Import Logger
import org.slf4j.LoggerFactory; // Import LoggerFactory


import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.ConcurrentHashMap; // Explicit import

@Service
public class CsvImportService {

    private static final Logger logger = LoggerFactory.getLogger(CsvImportService.class); // Initialize logger

    @Autowired
    private AdReportDataRepository adReportDataRepository;

    @Autowired
    private PlatformTransactionManager transactionManager; // Inject PlatformTransactionManager

    private final ExecutorService executorService = Executors.newFixedThreadPool(5);
    private final AtomicLong importJobCounter = new AtomicLong();
    private final ConcurrentHashMap<Long, String> importStatusMap = new ConcurrentHashMap<>(); // Use ConcurrentHashMap explicitly

    public Long importCsvData(MultipartFile file) throws IOException {
        long jobId = importJobCounter.incrementAndGet();
        importStatusMap.put(jobId, "IN_PROGRESS");
        logger.info("Import job {} initiated. Status: IN_PROGRESS.", jobId);

        // Capture file data to be used in the async thread to avoid issues with closing streams
        byte[] fileBytes = file.getBytes();
        String originalFilename = file.getOriginalFilename();
        String contentType = file.getContentType();

        executorService.submit(() -> {
            TransactionStatus status = transactionManager.getTransaction(new DefaultTransactionDefinition()); // Start new transaction
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(new java.io.ByteArrayInputStream(fileBytes)));
                 CSVReader csvReader = new CSVReader(reader)) {

                String[] header = csvReader.readNext();
                if (header == null || header.length == 0) {
                    importStatusMap.put(jobId, "FAILED: Empty file or no header.");
                    logger.warn("Import job {} FAILED: Empty file or no header. Filename: {}", jobId, originalFilename);
                    transactionManager.rollback(status); // Rollback if header is missing
                    return;
                }

                List<String> expectedHeaders = List.of("mobile_app_resolved_id", "mobile_app_name", "domain",
                        "ad_unit_name", "ad_unit_id", "inventory_format_name", "operating_system_version_name", "date",
                        "ad_exchange_total_requests", "ad_exchange_responses_served", "ad_exchange_match_rate",
                        "ad_exchange_line_item_level_impressions", "ad_exchange_line_item_level_clicks",
                        "ad_exchange_line_item_level_ctr", "average_ecpm", "payout");

                if (!List.of(header).containsAll(expectedHeaders)) {
                    importStatusMap.put(jobId, "FAILED: CSV header mismatch. Expected: " + expectedHeaders);
                    logger.error("Import job {} FAILED: CSV header mismatch. Expected: {}. Found: {}", jobId, expectedHeaders, List.of(header));
                    transactionManager.rollback(status); // Rollback if headers don't match
                    return;
                }

                String[] line;
                List<AdReportData> batch = new ArrayList<>();
                final int BATCH_SIZE = 5000;

                long processedRecords = 0;
                long errorRecords = 0;

                while ((line = csvReader.readNext()) != null) {
                    try {
                        AdReportData data = parseCsvLine(line, header);
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
                        // Continue processing other lines
                    }
                }
                if (!batch.isEmpty()) {
                    adReportDataRepository.saveAll(batch); // Save any remaining records
                    logger.debug("Import job {}: Saved final batch of {} records. Total processed: {}", jobId, batch.size(), processedRecords);
                }

                importStatusMap.put(jobId, String.format("COMPLETED: Processed %d records, %d errors.", processedRecords, errorRecords));
                logger.info("Import job {} COMPLETED. Processed {} records, {} errors.", jobId, processedRecords, errorRecords);
                transactionManager.commit(status); // Commit the transaction if successful

            } catch (CsvValidationException e) {
                importStatusMap.put(jobId, "FAILED: CSV format validation error - " + e.getMessage());
                logger.error("Import job {} FAILED: CSV validation error: {}", jobId, e.getMessage(), e);
                transactionManager.rollback(status); // Rollback on CSV validation error
            } catch (IOException e) {
                importStatusMap.put(jobId, "FAILED: I/O error during file processing - " + e.getMessage());
                logger.error("Import job {} FAILED: I/O error: {}", jobId, e.getMessage(), e);
                transactionManager.rollback(status); // Rollback on I/O error
            } catch (Exception e) { // Catch any other unexpected exceptions during async processing
                importStatusMap.put(jobId, "FAILED: An unexpected error occurred - " + e.getMessage());
                logger.error("Import job {} FAILED: An unexpected error occurred: {}", jobId, e.getMessage(), e);
                transactionManager.rollback(status); // Rollback on any other unexpected error
            }
        });

        return jobId;
    }

    public String getImportStatus(Long jobId) {
        return importStatusMap.getOrDefault(jobId, "NOT_FOUND");
    }

    private AdReportData parseCsvLine(String[] line, String[] header) {
        AdReportData data = new AdReportData();
        for (int i = 0; i < header.length; i++) {
            String colName = header[i].trim();
            String value = line[i].trim();

            try {
                switch (colName) {
                    case "mobile_app_resolved_id":
                        data.setMobileAppResolvedId(value);
                        break;
                    case "mobile_app_name":
                        data.setMobileAppName(value);
                        break;
                    case "domain":
                        data.setDomain(value);
                        break;
                    case "ad_unit_name":
                        data.setAdUnitName(value);
                        break;
                    case "ad_unit_id":
                        data.setAdUnitId(value);
                        break;
                    case "inventory_format_name":
                        data.setInventoryFormatName(value);
                        break;
                    case "operating_system_version_name":
                        data.setOperatingSystemVersionName(value);
                        break;
                    case "date":
                        data.setDate(LocalDate.parse(value));
                        break;
                    case "ad_exchange_total_requests":
                        data.setAdExchangeTotalRequests(Long.parseLong(value));
                        break;
                    case "ad_exchange_responses_served":
                        data.setAdExchangeResponsesServed(Long.parseLong(value));
                        break;
                    case "ad_exchange_match_rate":
                        data.setAdExchangeMatchRate(Double.parseDouble(value));
                        break;
                    case "ad_exchange_line_item_level_impressions":
                        data.setAdExchangeLineItemLevelImpressions(Long.parseLong(value));
                        break;
                    case "ad_exchange_line_item_level_clicks":
                        data.setAdExchangeLineItemLevelClicks(Long.parseLong(value));
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
                        // Log unexpected column names if necessary
                        break;
                }
            } catch (NumberFormatException | DateTimeParseException e) {
                // Log the exact line content causing the error
                logger.error("Data type mismatch error for job {}. Column '{}' with value '{}' in line {}: {}",
                        data.getId(), colName, value, String.join(",", line), e.getMessage(), e);
                throw new IllegalArgumentException("Data type mismatch for column '" + colName + "' with value '" + value + "': " + e.getMessage(), e);
            }
        }
        return data;
    }
}
