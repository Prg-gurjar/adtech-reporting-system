# Ad Reporting Dashboard

This project provides a comprehensive dashboard and reporting system for advertising data. It consists of a React-based frontend for interactive data visualization and filtering, and a Spring Boot backend API for data management, aggregation, and serving.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

* **Interactive Dashboard:** View key advertising metrics (Total Requests, Impressions, Clicks, Payout, eCPM) with a summary.
* **Dynamic Report Builder:**
    * Filter data by date range, mobile app names, inventory formats, and operating system versions.
    * Search across multiple fields in real-time.
    * Group report data by various dimensions (e.g., date, app name, ad unit).
    * Select specific metrics to display in the report table.
* **Pagination & Sorting:** Efficiently browse large datasets with server-side pagination and sorting capabilities.
* **CSV Export:** Export filtered report data to CSV format.
* **Robust Backend API:** RESTful API for fetching raw and aggregated advertising data.

## Technologies Used

**Frontend:**
* **React:** A JavaScript library for building user interfaces.
* **Ant Design:** A popular React UI library for enterprise-level products.
* **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
* **Axios:** Promise-based HTTP client for the browser and Node.js.
* **Day.js:** A minimalist JavaScript library for parsing, validating, manipulating, and displaying dates and times.

**Backend:**
* **Spring Boot:** Framework for building robust, production-ready Spring applications.
* **Spring Data JPA:** Simplifies data access for relational databases.
* **Hibernate:** JPA implementation for ORM.
* **MySQL / PostgreSQL:** (Specify which one you are using) Relational database for storing ad report data.
* **HikariCP:** High-performance JDBC connection pool.
* **Lombok:** (If used) Library to reduce boilerplate code.
* **Maven / Gradle:** (Specify which one you are using) Build automation tool.

## Project Structure

```
.
├── frontend/                 # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── api/              # API client for backend communication
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Main application pages (DashboardPage, ReportBuilderPage)
│   │   └── utils/            # Utility functions (e.g., debounce)
│   ├── package.json
│   └── tsconfig.json
├── backend/                  # Spring Boot backend application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/adtech/reportingsystem/
│   │   │   │   ├── AdReportingSystemApplication.java # Main application
│   │   │   │   ├── controller/   # REST Controllers
│   │   │   │   ├── model/        # JPA Entities (AdReportData)
│   │   │   │   ├── repository/   # Spring Data JPA repositories (AdReportDataRepository, custom impl)
│   │   │   │   └── service/      # Business logic (ReportService)
│   │   │   └── resources/        # Application properties, database scripts
│   │   │       ├── application.properties/yml
│   │   │       └── data.sql (optional, for initial data)
│   │   └── test/
│   ├── pom.xml (or build.gradle)
│   └── README.md (optional, if you have a separate backend readme)
└── README.md                 # This main project README
```

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

* Node.js (LTS version recommended) & npm (or Yarn) for the frontend.
* Java Development Kit (JDK 17 or higher recommended) for the backend.
* Maven or Gradle (depending on your backend setup).
* A running MySQL/PostgreSQL database instance.

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    cd your-repo-name/backend
    ```
2.  **Database Configuration:**
    * Create a database (e.g., `ad_reporting_db`) in your MySQL/PostgreSQL instance.
    * Open `backend/src/main/resources/application.properties` (or `application.yml`) and configure your database connection:
        ```properties
        spring.datasource.url=jdbc:mysql://localhost:3306/ad_reporting_db?useSSL=false&serverTimezone=UTC
        spring.datasource.username=your_db_username
        spring.datasource.password=your_db_password
        spring.jpa.hibernate.ddl-auto=update # or create, create-drop for development
        spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect # or PostgreSQLDialect
        # Additional HikariCP properties if needed
        spring.datasource.hikari.maximum-pool-size=10 # Adjust based on load
        spring.datasource.hikari.minimum-idle=2
        spring.datasource.hikari.idle-timeout=300000 # 5 minutes
        spring.datasource.hikari.max-lifetime=1800000 # 30 minutes
        spring.datasource.hikari.connection-timeout=30000 # 30 seconds
        ```
3.  **Build the Backend:**
    * **Using Maven:**
        ```bash
        cd backend
        mvn clean install
        ```
    * **Using Gradle:**
        ```bash
        cd backend
        ./gradlew clean build
        ```
    *(Note: If you encounter `OutOfMemoryError` during build or runtime, consider increasing JVM heap space: `MAVEN_OPTS="-Xmx2048m" mvn clean install` or set environment variable `JAVA_OPTS="-Xmx2048m"` before running the jar.)*

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend # From the backend directory, or cd your-repo-name/frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install # or yarn install
    ```
3.  **Configure API Endpoint:**
    * By default, the frontend will try to connect to the backend at `http://localhost:8080`. If your backend runs on a different port or host, you might need to configure it in your `frontend/src/api.ts` or similar file, or via a proxy setting in `package.json` for development.
        * **`frontend/package.json` (for development proxy):**
            ```json
            {
              "name": "frontend",
              "version": "0.1.0",
              "private": true,
              "proxy": "http://localhost:8080", // <--- Add this line
              "dependencies": {
                // ...
              }
            }
            ```
        * For production builds, you'll configure the actual API URL.

## Running the Application

1.  **Start the Backend:**
    * **Using Maven:**
        ```bash
        cd backend
        mvn spring-boot:run
        ```
    * **Using Jar:**
        ```bash
        cd backend/target # or backend/build/libs if Gradle
        java -jar your-application-name.jar
        ```
    The backend will typically run on `http://localhost:8080`.

2.  **Start the Frontend:**
    * Open a **new terminal window**.
    * **Navigate to the frontend directory:**
        ```bash
        cd frontend
        ```
    * **Start the React development server:**
        ```bash
        npm start # or yarn start
        ```
    The frontend will typically open in your browser at `http://localhost:3000`.

## API Endpoints

(Provide a brief overview of your main backend API endpoints)

* `GET /api/reports/dimensions`: Get available reporting dimensions.
* `GET /api/reports/metrics`: Get available reporting metrics.
* `POST /api/reports/query`: Query paginated and sortable report data.
* `POST /api/reports/aggregate`: Get aggregated summary report data.
* `POST /api/reports/export`: Export report data to CSV.

## Database Schema

The `AdReportData` entity typically contains fields like:

* `id` (Primary Key)
* `date`
* `mobileAppResolvedId`
* `mobileAppName`
* `domain`
* `adUnitName`
* `adUnitId`
* `inventoryFormatName`
* `operatingSystemVersionName`
* `adExchangeTotalRequests`
* `adExchangeResponsesServed`
* `adExchangeMatchRate`
* `adExchangeLineItemLevelImpressions`
* `adExchangeLineItemLevelClicks`
* `adExchangeLineItemLevelCtr`
* `averageEcpm`
* `payout`

(You can add a more detailed schema or even a diagram here if you wish)

## Deployment

Deploying a full-stack application involves deploying the backend API and the frontend separately, then configuring them to communicate.

**Backend Deployment (Spring Boot):**

You can deploy your Spring Boot backend to various cloud platforms. Popular choices include:

* **Heroku:** Simple for smaller projects. You can push your Git repository directly.
* **AWS (EC2, Elastic Beanstalk):** More control, but steeper learning curve.
* **Google Cloud Platform (App Engine, Compute Engine):** Similar to AWS.
* **DigitalOcean, Render, Fly.io:** Developer-friendly alternatives.

**General steps:**
1.  **Build a production-ready JAR/WAR file:** `mvn clean package` (Maven) or `./gradlew clean bootJar` (Gradle).
2.  **Choose a cloud provider.**
3.  **Configure environment variables:** Database URL, credentials, any other secrets.
4.  **Upload and deploy the JAR/WAR file.**
5.  **Set up a persistent database service.**

**Frontend Deployment (React):**

For the React frontend, you'll build static assets and serve them.

* **Vercel / Netlify:** Excellent for static site deployment and easy CI/CD integration.
* **GitHub Pages:** Simple for basic static sites.
* **AWS S3 + CloudFront:** For highly scalable static site hosting.
* **Serve directly from your backend:** You can configure Spring Boot to serve the React build (`npm run build`) from its static resources, but this couples the deployments.

**General steps:**
1.  **Build the React application for production:**
    ```bash
    cd frontend
    npm run build # or yarn build
    ```
    This creates an optimized `build` folder.
2.  **Choose a hosting provider (Vercel/Netlify recommended for ease).**
3.  **Upload the contents of the `build` folder.**
4.  **Configure environment variables:** If your frontend needs to know the deployed backend API URL, you'll pass it as an environment variable during the build process (e.g., `REACT_APP_API_URL` for Create React App).

**Example Deployment Flow (using Heroku for Backend, Vercel for Frontend):**

1.  **Backend (Heroku):**
    * Install Heroku CLI.
    * `heroku login`
    * `heroku create your-backend-app-name`
    * `git subtree push --prefix backend heroku main` (If you have a monorepo setup)
    * Configure Heroku PostgreSQL add-on or external database.
    * Set `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` environment variables on Heroku.

2.  **Frontend (Vercel):**
    * Install Vercel CLI.
    * `cd frontend`
    * `npm run build`
    * `vercel` (follow prompts to link to Git repo and deploy).
    * Set `REACT_APP_API_URL` environment variable in Vercel project settings to your deployed backend URL (e.g., `https://your-backend-app-name.herokuapp.com/api`).

## Troubleshooting

* **`OutOfMemoryError` on Backend:** Ensure your database queries are optimized (indexes!), and increase JVM heap space (`-Xmx`). Large `findAll()` operations without pagination are a common cause.
* **Frontend Data Not Loading:** Check your browser's developer console for network errors. Ensure the frontend is pointing to the correct backend API URL. Check backend logs for incoming requests and errors.
* **Application Hangs/Slow:** This is usually due to large data fetches or inefficient rendering.
    * **Backend:** Verify pagination is working, optimize database queries (indexes, projections), and ensure aggregation happens in the DB.
    * **Frontend:** Reduce default `pageSize` for tables. Consider virtualized lists/tables for displaying thousands of rows.
* **"Thread starvation or clock leap detected":** Often a symptom of backend resource exhaustion (CPU/memory) or long GC pauses. Address underlying performance bottlenecks.

## Contributing

(Optional: Guidelines for how others can contribute to your project)

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
5.  Push to the branch (`git push origin feature/AmazingFeature`).
6.  Open a Pull Request.

## License

Distributed under the MIT License. See `LICENSE` for more information. (You might want to create a `LICENSE` file in your root directory if you choose a specific license).

#   a d t e c h - r e p o r t i n g - s y s t e m  
 #   a d t e c h - r e p o r t i n g - s y s t e m  
 