package com.adtech.reportingsystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // CRITICAL UPDATE: Ensure this matches the exact origin of your deployed frontend.
                .allowedOrigins("http://localhost:3000", "https://adtech-reporting-system-n1w9-p4povizh6.vercel.app") // Updated URL
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
