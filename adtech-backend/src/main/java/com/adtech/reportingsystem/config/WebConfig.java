package com.adtech.reportingsystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**") // Apply CORS to all paths under /api
                // CRITICAL: This must exactly match your Vercel frontend URL.
                // Based on your latest error, this is the correct URL:
                .allowedOrigins("http://localhost:3000", "https://adtech-reporting-system-n1w9-p4povizh6.vercel.app")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Ensure OPTIONS and POST are allowed
                .allowedHeaders("*") // Allow all headers
                .allowCredentials(true); // Allow sending cookies/auth headers
    }
}
