package com.adtech.reportingsystem.controller;

import com.adtech.reportingsystem.model.AdReportData;
import com.adtech.reportingsystem.service.CsvImportService;
import com.adtech.reportingsystem.service.ReportService;
import com.opencsv.CSVWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.StringWriter;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "https://adtech-reporting-system-n1w9.vercel.app")  // Allow Vercel frontend
public class AdReportController {

    @Autowired
    private CsvImportService csvImportService;

    @Autowired
    private ReportService reportService;

    @PostMapping("/data/import")
    public ResponseEntity<?> uploadCsv(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a CSV file to upload.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !(contentType.contains("csv") || contentType.equals("application/vnd.ms-excel"))) {
            return ResponseEntity.badRequest().body("Invalid file type. Only CSV files are allowed.");
        }

        try {
            Long jobId = csvImportService.importCsvData(file);
            return ResponseEntity.ok(Map.of(
                    "message", "CSV import initiated successfully.",
                    "jobId", jobId
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload CSV: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred during CSV import: " + e.getMessage());
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

    @PostMapping("/reports/aggregate")
    public ResponseEntity<List<Map<String, Object>>> aggregateReports(@RequestBody ReportService.ReportQueryRequest queryRequest) {
        List<Map<String, Object>> data = reportService.getAggregatedReportData(queryRequest);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/reports/export")
    public ResponseEntity<byte[]> exportReports(@RequestBody ReportService.ReportQueryRequest queryRequest) throws IOException {
        List<Map<String, Object>> dataToExport = reportService.getAggregatedReportData(queryRequest);

        StringWriter writer = new StringWriter();
        try (CSVWriter csvWriter = new CSVWriter(writer)) {
            List<String> csvHeaders = new ArrayList<>();
            if (!dataToExport.isEmpty()) {
                csvHeaders.addAll(dataToExport.get(0).keySet());
            }
            csvWriter.writeNext(csvHeaders.toArray(new String[0]));

            for (Map<String, Object> row : dataToExport) {
                List<String> rowValues = new ArrayList<>();
                for (String header : csvHeaders) {
                    Object value = row.get(header);
                    if (value instanceof LocalDate) {
                        rowValues.add(((LocalDate) value).format(DateTimeFormatter.ISO_LOCAL_DATE));
                    } else {
                        rowValues.add(value != null ? value.toString() : "");
                    }
                }
                csvWriter.writeNext(rowValues.toArray(new String[0]));
            }
        }

        byte[] csvBytes = writer.toString().getBytes(StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=adtech_report.csv");
        headers.setContentLength(csvBytes.length);

        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }
}
