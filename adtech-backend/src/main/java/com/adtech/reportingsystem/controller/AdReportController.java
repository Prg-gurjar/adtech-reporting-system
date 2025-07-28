
package com.adtech.reportingsystem.controller;

import com.adtech.reportingsystem.model.AdReportData;
import com.adtech.reportingsystem.service.CsvImportService;
import com.adtech.reportingsystem.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.opencsv.CSVWriter;

import java.io.IOException;
import java.io.StringWriter;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
//import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class AdReportController {

    @Autowired
    private CsvImportService csvImportService;

    @Autowired
    private ReportService reportService;

    @PostMapping("/data/import") // This mapping is correct and remains unchanged
    public ResponseEntity<?> uploadCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a CSV file to upload.");
        }
        if (!"text/csv".equals(file.getContentType())) {
            return ResponseEntity.badRequest().body("Invalid file type. Only CSV files are allowed.");
        }

        try {
            Long jobId = csvImportService.importCsvData(file);
            return ResponseEntity.ok(Map.of("message", "CSV import initiated successfully.", "jobId", jobId));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload CSV: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred during CSV import: " + e.getMessage());
        }
    }

    @GetMapping("/data/import/status/{jobId}")
    public ResponseEntity<?> getImportStatus(@PathVariable Long jobId) {
        String status = csvImportService.getImportStatus(jobId);
        if ("NOT_FOUND".equals(status)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Import job not found.");
        }
        return ResponseEntity.ok(Map.of("jobId", jobId, "status", status));
    }


    @GetMapping("/reports/dimensions")
    public ResponseEntity<List<String>> getDimensions() {
        return ResponseEntity.ok(reportService.getAvailableDimensions());
    }

    @GetMapping("/reports/metrics")
    public ResponseEntity<List<String>> getMetrics() {
        return ResponseEntity.ok(reportService.getAvailableMetrics());
    }

    @PostMapping("/reports/query")
    public ResponseEntity<Page<AdReportData>> queryReports(@RequestBody ReportService.ReportQueryRequest queryRequest) {
        Page<AdReportData> data = reportService.getReportData(queryRequest);
        return ResponseEntity.ok(data);
    }

    // Example in AdReportController.java
    //    @PostMapping("/reports/query") // Or whatever your mapping is
    //    public ResponseEntity<ReportResponse> queryReports(@RequestBody QueryParams queryParams) {
    //        // Basic validation for page and pageSize
    //        if (queryParams.getPage() < 0) { // Page is usually 0-indexed in Spring Data JPA
    //            queryParams.setPage(0); // Default to first page
    //        }
    //        if (queryParams.getPageSize() < 1) {
    //            // Throw an exception, return a bad request, or set a default valid size
    //            throw new IllegalArgumentException("Page size must be at least one.");
    //            // Or return new ResponseEntity<>("Page size must be at least one.", HttpStatus.BAD_REQUEST);
    //        }
    //        // ... then call your service
    //        return ResponseEntity.ok(reportService.getReportData(queryParams));
    //    }


    // For dashboard overview and charts (aggregated data)
    @PostMapping("/reports/aggregate")
    public ResponseEntity<List<Map<String, Object>>> aggregateReports(@RequestBody ReportService.ReportQueryRequest queryRequest) {
        List<Map<String, Object>> data = reportService.getAggregatedReportData(queryRequest);
        return ResponseEntity.ok(data);
    }


    @PostMapping("/reports/export")
    public ResponseEntity<byte[]> exportReports(@RequestBody ReportService.ReportQueryRequest queryRequest) throws IOException {
        // Fetch all data matching the filters (no pagination for export)
        ReportService.ReportQueryRequest exportQuery = new ReportService.ReportQueryRequest();
        exportQuery.setStartDate(queryRequest.getStartDate());
        exportQuery.setEndDate(queryRequest.getEndDate());
        exportQuery.setMobileAppNames(queryRequest.getMobileAppNames());
        exportQuery.setInventoryFormatNames(queryRequest.getInventoryFormatNames());
        exportQuery.setOperatingSystemVersionNames(queryRequest.getOperatingSystemVersionNames());
        exportQuery.setSearchQuery(queryRequest.getSearchQuery());
        exportQuery.setGroupByDimensions(queryRequest.getGroupByDimensions()); // If you want to export aggregated
        exportQuery.setMetrics(queryRequest.getMetrics());

        List<Map<String, Object>> dataToExport = reportService.getAggregatedReportData(exportQuery); // Or getReportData for raw data

        StringWriter writer = new StringWriter();
        try (CSVWriter csvWriter = new CSVWriter(writer)) {
            // Write header
            List<String> headers = new ArrayList<>();
            if (!dataToExport.isEmpty()) {
                headers.addAll(dataToExport.get(0).keySet()); // Get all keys from the first row as headers
            }
            csvWriter.writeNext(headers.toArray(new String[0]));

            // Write data rows
            for (Map<String, Object> row : dataToExport) {
                List<String> rowValues = new ArrayList<>();
                for (String header : headers) {
                    Object value = row.get(header);
                    if (value instanceof LocalDate) {
                        rowValues.add(((LocalDate) value).format(DateTimeFormatter.ISO_LOCAL_DATE));
                    } else if (value != null) {
                        rowValues.add(value.toString());
                    } else {
                        rowValues.add("");
                    }
                }
                csvWriter.writeNext(rowValues.toArray(new String[0]));
            }
        }

        byte[] csvBytes = writer.toString().getBytes("UTF-8");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"adtech_report.csv\"");
        headers.setContentLength(csvBytes.length);

        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }
}
