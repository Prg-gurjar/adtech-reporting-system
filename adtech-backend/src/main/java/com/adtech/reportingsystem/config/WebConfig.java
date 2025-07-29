package com.adtech.reportingsystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**") // Apply CORS to all paths under /api
                .allowedOrigins("http://localhost:3000", "https://adtech-reporting-system-n1w9-kkti5623w.vercel.app") // <-- IMPORTANT: Use your exact Vercel URL
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Allow these HTTP methods
                .allowedHeaders("*") // Allow all headers
                .allowCredentials(true); // Allow sending cookies/auth headers
        }
}
