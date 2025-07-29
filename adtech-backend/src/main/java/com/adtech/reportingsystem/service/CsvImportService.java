package com.adtech.reportingsystem.service;

import com.adtech.reportingsystem.model.AdReportData;
import com.adtech.reportingsystem.repository.AdReportDataRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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

@Service
public class CsvImportService {

    @Autowired
    private AdReportDataRepository adReportDataRepository;

    private final ExecutorService executorService = Executors.newFixedThreadPool(5); 
    private final AtomicLong importJobCounter = new AtomicLong();
    private final java.util.Map<Long, String> importStatusMap = new java.util.concurrent.ConcurrentHashMap<>();

    @Transactional
    public Long importCsvData(MultipartFile file) throws IOException {
        long jobId = importJobCounter.incrementAndGet();
        importStatusMap.put(jobId, "IN_PROGRESS");

        executorService.submit(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
                 CSVReader csvReader = new CSVReader(reader)) {

                String[] header = csvReader.readNext();
                if (header == null || header.length == 0) {
                    importStatusMap.put(jobId, "FAILED: Empty file or no header.");
                    return;
                }

                List<String> expectedHeaders = List.of("mobile_app_resolved_id", "mobile_app_name", "domain",
                        "ad_unit_name", "ad_unit_id", "inventory_format_name", "operating_system_version_name", "date",
                        "ad_exchange_total_requests", "ad_exchange_responses_served", "ad_exchange_match_rate",
                        "ad_exchange_line_item_level_impressions", "ad_exchange_line_item_level_clicks",
                        "ad_exchange_line_item_level_ctr", "average_ecpm", "payout");

                if (!List.of(header).containsAll(expectedHeaders)) {
                    importStatusMap.put(jobId, "FAILED: CSV header mismatch. Expected: " + expectedHeaders);
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
                        }
                        processedRecords++;
                    } catch (Exception e) {
                        System.err.println("Error parsing CSV line: " + String.join(",", line) + " - " + e.getMessage());
                        errorRecords++;
                        
                    }
                }
                if (!batch.isEmpty()) {
                    adReportDataRepository.saveAll(batch); 
                }
                importStatusMap.put(jobId, String.format("COMPLETED: Processed %d records, %d errors.", processedRecords, errorRecords));

            } catch (CsvValidationException e) {
                importStatusMap.put(jobId, "FAILED: CSV format validation error - " + e.getMessage());
                System.err.println("CSV validation error for job " + jobId + ": " + e.getMessage());
            } catch (IOException e) {
                importStatusMap.put(jobId, "FAILED: I/O error during file processing - " + e.getMessage());
                System.err.println("I/O error for job " + jobId + ": " + e.getMessage());
            } catch (Exception e) {
                importStatusMap.put(jobId, "FAILED: An unexpected error occurred - " + e.getMessage());
                System.err.println("Unexpected error for job " + jobId + ": " + e.getMessage());
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
                        break;
                }
            } catch (NumberFormatException | DateTimeParseException e) {
                throw new IllegalArgumentException("Data type mismatch for column '" + colName + "' with value '" + value + "': " + e.getMessage(), e);
            }
        }
        return data;
    }
}
