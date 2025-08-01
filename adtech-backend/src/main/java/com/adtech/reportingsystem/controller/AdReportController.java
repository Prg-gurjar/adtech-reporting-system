// package com.adtech.reportingsystem.controller;

// import com.adtech.reportingsystem.model.AdReportData;
// import com.adtech.reportingsystem.service.ReportService;
// import com.adtech.reportingsystem.service.CsvImportService;
// import com.adtech.reportingsystem.service.ReportService.ReportQueryRequest;
// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.data.domain.Page;
// import org.springframework.http.HttpHeaders;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.MediaType;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.multipart.MultipartFile;

// import java.io.PrintWriter;
// import java.io.StringWriter;
// import java.util.List;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/reports")
// public class AdReportController {

//     private static final Logger logger = LoggerFactory.getLogger(AdReportController.class);

//     @Autowired
//     private ReportService reportService;

//     @Autowired
//     private CsvImportService csvImportService;

//     @GetMapping("/dimensions")
//     public ResponseEntity<List<String>> getDimensions() {
//         logger.info("Fetching available dimensions.");
//         List<String> dimensions = reportService.getAvailableDimensions();
//         return ResponseEntity.ok(dimensions);
//     }

//     @GetMapping("/metrics")
//     public ResponseEntity<List<String>> getMetrics() {
//         logger.info("Fetching available metrics.");
//         List<String> metrics = reportService.getAvailableMetrics();
//         return ResponseEntity.ok(metrics);
//     }

//     @PostMapping("/query")
//     public ResponseEntity<Page<AdReportData>> queryReport(@RequestBody ReportQueryRequest queryRequest) {
//         logger.info("Received report query request: {}", queryRequest);
//         Page<AdReportData> reportPage = reportService.getReportData(queryRequest);
//         return ResponseEntity.ok(reportPage);
//     }

//     @PostMapping("/aggregate")
//     public ResponseEntity<List<Map<String, Object>>> aggregateReport(@RequestBody ReportQueryRequest queryRequest) {
//         logger.info("Received aggregation report query request: {}", queryRequest);
//         List<Map<String, Object>> aggregatedData = reportService.getAggregatedReportData(queryRequest);
//         return ResponseEntity.ok(aggregatedData);
//     }

//     @PostMapping("/export")
//     public ResponseEntity<String> exportReport(@RequestBody ReportQueryRequest queryRequest) {
//         logger.info("Received export report request: {}", queryRequest);
//         try {
//             StringWriter stringWriter = new StringWriter();
//             PrintWriter printWriter = new PrintWriter(stringWriter);

//             reportService.exportReport(queryRequest, printWriter);

//             HttpHeaders headers = new HttpHeaders();
//             headers.setContentType(MediaType.parseMediaType("text/csv"));
//             headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ad_report.csv\"");
//             headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

//             return new ResponseEntity<>(stringWriter.toString(), headers, HttpStatus.OK);

//         } catch (Exception e) {
//             logger.error("Error during report export: {}", e.getMessage(), e);
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body("Failed to export report: " + e.getMessage());
//         }
//     }

//     @PostMapping("/upload")
//     public ResponseEntity<String> uploadCsvFile(@RequestParam("file") MultipartFile file) {
//         logger.info("Received CSV file upload request: {}", file.getOriginalFilename());
//         if (file.isEmpty()) {
//             return ResponseEntity.badRequest().body("Please select a CSV file to upload.");
//         }
//         if (!"text/csv".equals(file.getContentType()) && !"application/vnd.ms-excel".equals(file.getContentType())) {
//             return ResponseEntity.badRequest().body("Only CSV files are allowed.");
//         }

//         try {
//             Long jobId = csvImportService.importCsvData(file);
//             return ResponseEntity.ok("CSV import started successfully with job ID: " + jobId + " for: " + file.getOriginalFilename());
//         } catch (Exception e) {
//             logger.error("Error processing CSV file upload: {}", e.getMessage(), e);
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                     .body("Failed to process CSV import: " + e.getMessage());
//         }
//     }

//     @GetMapping("/distinct-mobile-app-names")
//     public ResponseEntity<List<String>> getDistinctMobileAppNames() {
//         logger.info("Fetching distinct mobile app names.");
//         List<String> appNames = reportService.getDistinctMobileAppNames();
//         return ResponseEntity.ok(appNames);
//     }

//     @GetMapping("/distinct-inventory-format-names")
//     public ResponseEntity<List<String>> getDistinctInventoryFormatNames() {
//         logger.info("Fetching distinct inventory format names.");
//         List<String> formats = reportService.getDistinctInventoryFormatNames();
//         return ResponseEntity.ok(formats);
//     }

//     @GetMapping("/distinct-operating-system-version-names")
//     public ResponseEntity<List<String>> getDistinctOperatingSystemVersionNames() {
//         logger.info("Fetching distinct operating system version names.");
//         List<String> osVersions = reportService.getDistinctOperatingSystemVersionNames();
//         return ResponseEntity.ok(osVersions);
//     }
//}

package com.adtech.reportingsystem.controller;

import com.adtech.reportingsystem.model.AdReportData;
import com.adtech.reportingsystem.service.ReportService;
import com.adtech.reportingsystem.service.CsvImportService; // Ensure this import is correct
import com.adtech.reportingsystem.service.ReportService.ReportQueryRequest;
import com.adtech.reportingsystem.dto.AdReportDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class AdReportController {

    private static final Logger logger = LoggerFactory.getLogger(AdReportController.class);

    @Autowired
    private ReportService reportService;

    @Autowired
    private CsvImportService csvImportService;

    @GetMapping("/dimensions")
    public ResponseEntity<List<String>> getDimensions() {
        logger.info("Fetching available dimensions.");
        List<String> dimensions = reportService.getAvailableDimensions();
        return ResponseEntity.ok(dimensions);
    }

    @GetMapping("/metrics")
    public ResponseEntity<List<String>> getMetrics() {
        logger.info("Fetching available metrics.");
        List<String> metrics = reportService.getAvailableMetrics();
        return ResponseEntity.ok(metrics);
    }

    @PostMapping("/query")
    public ResponseEntity<Page<AdReportDto>> queryReport(@RequestBody ReportQueryRequest queryRequest) {
        logger.info("Received report query request: {}", queryRequest);
        Page<AdReportData> reportPage = reportService.getReportData(queryRequest);
        Page<AdReportDto> dtoPage = reportPage.map(this::convertToDto);
        return ResponseEntity.ok(dtoPage);
    }

    private AdReportDto convertToDto(AdReportData adReportData) {
        AdReportDto dto = new AdReportDto();
        dto.setId(adReportData.getId());
        dto.setMobileAppName(adReportData.getMobileAppName());
        dto.setInventoryFormatName(adReportData.getInventoryFormatName());
        dto.setOperatingSystemVersionName(adReportData.getOperatingSystemVersionName());
        dto.setDate(adReportData.getDate());
        dto.setTotalRequests(adReportData.getAdExchangeTotalRequests());
        dto.setImpressions(adReportData.getAdExchangeLineItemLevelImpressions());
        dto.setClicks(adReportData.getAdExchangeLineItemLevelClicks());
        dto.setPayout(adReportData.getPayout());
        dto.setAverageEcpm(adReportData.getAverageEcpm());
        dto.setMatchRate(adReportData.getAdExchangeMatchRate());
        return dto;
    }

    @PostMapping("/aggregate")
    public ResponseEntity<List<Map<String, Object>>> aggregateReport(@RequestBody ReportQueryRequest queryRequest) {
        logger.info("Received aggregation report request: {}", queryRequest);
        List<Map<String, Object>> aggregatedData = reportService.getAggregatedReportData(queryRequest);
        return ResponseEntity.ok(aggregatedData);
    }

    @PostMapping("/export")
    public ResponseEntity<String> exportReport(@RequestBody ReportQueryRequest queryRequest) {
        logger.info("Received export report request: {}", queryRequest);
        try {
            StringWriter stringWriter = new StringWriter();
            PrintWriter printWriter = new PrintWriter(stringWriter);

            reportService.exportReport(queryRequest, printWriter);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ad_report.csv\"");
            headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

            return new ResponseEntity<>(stringWriter.toString(), headers, HttpStatus.OK);

        } catch (Exception e) {
            logger.error("Error during report export: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to export report: " + e.getMessage());
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadCsvFile(@RequestParam("file") MultipartFile file) {
        logger.info("Received CSV file upload request: {}", file.getOriginalFilename());
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a CSV file to upload.");
        }
        if (!"text/csv".equals(file.getContentType()) && !"application/vnd.ms-excel".equals(file.getContentType())) {
            return ResponseEntity.badRequest().body("Only CSV files are allowed.");
        }

        try {
            Long jobId = csvImportService.importCsvData(file);
            return ResponseEntity.ok("CSV import started successfully with job ID: " + jobId + " for: " + file.getOriginalFilename());
        } catch (Exception e) {
            logger.error("Error processing CSV file upload: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to process CSV import: " + e.getMessage());
        }
    }

    @GetMapping("/distinct-mobile-app-names")
    public ResponseEntity<List<String>> getDistinctMobileAppNames() {
        logger.info("Fetching distinct mobile app names.");
        List<String> appNames = reportService.getDistinctMobileAppNames();
        return ResponseEntity.ok(appNames);
    }

    @GetMapping("/distinct-inventory-format-names")
    public ResponseEntity<List<String>> getDistinctInventoryFormatNames() {
        logger.info("Fetching distinct inventory format names.");
        List<String> formats = reportService.getDistinctInventoryFormatNames();
        return ResponseEntity.ok(formats);
    }

    @GetMapping("/distinct-operating-system-version-names")
    public ResponseEntity<List<String>> getDistinctOperatingSystemVersionNames() {
        logger.info("Fetching distinct operating system version names.");
        List<String> osVersions = reportService.getDistinctOperatingSystemVersionNames();
        return ResponseEntity.ok(osVersions);
    }
}

