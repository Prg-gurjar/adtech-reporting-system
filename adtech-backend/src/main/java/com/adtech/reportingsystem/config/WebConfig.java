// adtech-backend/src/main/java/com/adtech/reportingsystem/config/WebConfig.java
package com.adtech.reportingsystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**") // This line allows requests to your /api/** endpoints.
                // IMPORTANT: Update this line with the exact URL of your deployed frontend.
                // As per your latest logs, it is 'https://adtech-reporting-system-n1w9-kkti5623w.vercel.app'
                .allowedOrigins("http://localhost:3000", "https://adtech-reporting-system-n1w9-kkti5623w.vercel.app") // <--- CRITICAL UPDATE HERE
                // These methods (GET, POST, etc.) are allowed for cross-origin requests.
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                // Allow all headers.
                .allowedHeaders("*")
                // Allow credentials (like cookies or authentication headers).
                .allowCredentials(true);
    }
}