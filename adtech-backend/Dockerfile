# Use a base image with Java 17 and Maven pre-installed
    # You can choose other versions like 'eclipse-temurin:21-jdk-jammy' if you use Java 21
    FROM maven:3.9.6-eclipse-temurin-21-jammy

    # Set the working directory inside the container
    WORKDIR /app

    # Copy the Maven project files (pom.xml) first to leverage Docker cache
    COPY pom.xml .

    # Copy the source code
    COPY src ./src

    # Build the Spring Boot application
    # -DskipTests: Skips running tests during the build
    # -Dspring-boot.repackage.skip=true: Prevents Spring Boot from repackaging the JAR
    #   We'll build the executable JAR in the next step to control its name.
    RUN mvn clean install -DskipTests

    # Build the final executable JAR using Spring Boot's repackage goal
    # This creates the 'adtech-reportiningSystem-0.1.jar' in the target directory
    RUN mvn spring-boot:repackage

    # Expose the port your Spring Boot application runs on (default 8080)
    # This corresponds to server.port in application.properties
    EXPOSE 8091

    # Command to run the application when the container starts
    # Ensure 'adtech-reportiningSystem-0.1.jar' matches your actual JAR name
    ENTRYPOINT ["java", "-jar", "target/adtech-reportiningSystem-0.1.jar"]
    