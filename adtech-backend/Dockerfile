# Step 1: Use official Java 17 slim image
FROM openjdk:21-slim

# Step 2: Set working directory inside the container
WORKDIR /app

# Step 3: Copy your project's generated JAR into the container
COPY target/adtech-reportiningSystem-0.1.jar

# Step 4: Expose the port your Spring Boot app uses
EXPOSE 8091

# Step 5: Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
