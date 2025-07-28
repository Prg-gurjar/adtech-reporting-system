# Stage 1: Build the application using Maven
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy the entire project
COPY . .

# Move into backend directory and build the JAR
WORKDIR /app/adtech-backend
RUN mvn clean package -DskipTests

# Stage 2: Run the built Spring Boot JAR
FROM openjdk:21-slim

WORKDIR /app

# Copy the generated JAR from the builder stage
COPY --from=builder /app/adtech-backend/target/*.jar app.jar

EXPOSE 8091

ENTRYPOINT ["java", "-jar", "app.jar"]
