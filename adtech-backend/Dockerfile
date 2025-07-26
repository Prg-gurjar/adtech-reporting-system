# Use a base image with Java 17 and Maven pre-installed
    # You can choose other versions like 'eclipse-temurin:21-jdk-jammy' if you use Java 21
    FROM maven:3.9.6-eclipse-temurin-21-jammy

    # Set the working directory inside the container
    WORKDIR /app

    # Copy the Maven project files (pom.xml) first to leverage Docker cache
    COPY pom.xml .

    # Copy the source code
    COPY src ./src
# Build the Spring Boot application and repackage it in a single Maven command
# 'install' runs the 'package' phase, which creates the initial JAR.
# 'spring-boot:repackage' then takes that JAR and makes it executable.
# Running them in one command ensures the 'repackage' goal finds the 'source file'.
RUN mvn clean install -DskipTests spring-boot:repackage


    # Expose the port your Spring Boot application runs on (default 8080)
    # This corresponds to server.port in application.properties
    EXPOSE 8091

    # Command to run the application when the container starts
    # Ensure 'adtech-reportiningSystem-0.1.jar' matches your actual JAR name
    ENTRYPOINT ["java", "-jar", "target/adtech-reportiningSystem-0.1.jar"]
    