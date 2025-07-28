# Ad Reporting Dashboard

This project provides a comprehensive dashboard and reporting system for advertising data. It consists of a React-based frontend for interactive data visualization and filtering, and a Spring Boot backend API for data management, aggregation, and serving.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (Local)](#backend-setup-local)
  - [Frontend Setup (Local)](#frontend-setup-local)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
  - [Backend Deployment (Render)](#backend-deployment-render)
  - [PostgreSQL Database on Render](#postgresql-database-on-render)
  - [Frontend Deployment](#frontend-deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

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
* **Java 21:** The specific JDK version used.
* **Maven:** Build automation and dependency management tool.
* **Spring Data JPA:** Simplifies data access for relational databases.
* **Hibernate:** JPA implementation for ORM.
* **PostgreSQL:** Relational database for storing ad report data.
* **HikariCP:** High-performance JDBC connection pool (included with Spring Boot).
* **Lombok:** Library to reduce boilerplate code (e.g., getters, setters).
* **OpenCSV:** For CSV file processing (e.g., imports/exports).

## Project Structure


├── frontend/             # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── api/          # API client for backend communication
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Main application pages (DashboardPage, ReportBuilderPage)
│   │   └── utils/        # Utility functions (e.g., debounce)
│   ├── package.json
│   └── tsconfig.json
├── backend/              # Spring Boot backend application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/adtech/reportingsystem/
│   │   │   │   ├── AdReportingSystemApplication.java # Main application
│   │   │   │   ├── controller/   # REST Controllers
│   │   │   │   ├── model/        # JPA Entities (AdReportData)
│   │   │   │   ├── repository/   # Spring Data JPA repositories (AdReportDataRepository, custom impl)
│   │   │   │   └── service/      # Business logic (ReportService)
│   │   │   └── resources/        # Application properties, database scripts
│   │   │       ├── application.properties
│   │   │       └── data.sql (optional, for initial data)
│   │   └── test/
│   ├── pom.xml
│   └── README.md (optional, for backend-specific details)
└── README.md             # This main project README


## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

* **Node.js** (LTS version recommended) & **npm** (or Yarn) for the frontend.
* **Java Development Kit (JDK 21)** for the backend.
* **Maven 3.x** for the backend.
* A running **PostgreSQL database** instance (local or Dockerized).
* **Git**

### Backend Setup (Local)

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Prg-gurjar/adtech-reporting-system.git](https://github.com/Prg-gurjar/adtech-reporting-system.git)
    cd adtech-reporting-system/backend
    ```
2.  **Database Configuration:**
    * Ensure you have a local PostgreSQL database instance running.
    * Create a database (e.g., `ad_reporting_db`) and a user with appropriate permissions.
    * Open `backend/src/main/resources/application.properties` and configure your database connection:
        ```properties
        # application.properties (local development)
        spring.datasource.url=jdbc:postgresql://localhost:5432/[your_local_db_name]
        spring.datasource.username=[your_local_db_username]
        spring.datasource.password=[your_local_db_password]
        spring.datasource.driver-class-name=org.postgresql.Driver

        spring.jpa.hibernate.ddl-auto=update # or create, create-drop for development
        spring.jpa.show-sql=true
        spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

        server.port=8091 # Or any other port you prefer

        # Other local development properties (CORS, logging, etc.)
        spring.web.cors.mapping./api/**.allowed-origins=http://localhost:3000
        spring.web.cors.mapping./api/**.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
        spring.web.cors.mapping./api/**.allowed-headers=*
        spring.web.cors.mapping./api/**.allow-credentials=true
        ```
        **Replace `[your_local_db_name]`, `[your_local_db_username]`, and `[your_local_db_password]` with your actual local PostgreSQL credentials.**

3.  **Build the Backend:**
    ```bash
    cd backend
    mvn clean install
    ```
    *(Note: If you encounter `OutOfMemoryError` during build or runtime, consider increasing JVM heap space: `MAVEN_OPTS="-Xmx2048m" mvn clean install` or set environment variable `JAVA_OPTS="-Xmx2048m"` before running the jar.)*

### Frontend Setup (Local)

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend # From the project root, or cd ../frontend from backend directory
    ```
2.  **Install dependencies:**
    ```bash
    npm install # or yarn install
    ```
3.  **Configure API Endpoint:**
    * During local development, the frontend will typically proxy API requests to your local backend. Ensure your `frontend/package.json` includes the proxy setting:
        ```json
        {
          "name": "frontend",
          "version": "0.1.0",
          "private": true,
          "proxy": "http://localhost:8091", // <--- Make sure this matches your backend's local port
          "dependencies": {
            // ...
          }
        }
        ```
        If your backend is running on a different port than `8091`, update the `proxy` value accordingly.

## Running the Application

1.  **Start the Backend:**
    * Open a terminal and navigate to the `backend` directory.
    * **Using Maven:**
        ```bash
        mvn spring-boot:run
        ```
    * **Using Jar (after `mvn clean package`):**
        ```bash
        cd backend/target
        java -jar adtech-reportiningSystem-0.1.jar # Ensure this matches your actual JAR name
        ```
    The backend will typically run on `http://localhost:8091`.

2.  **Start the Frontend:**
    * Open a **new terminal window** and navigate to the `frontend` directory.
    * **Start the React development server:**
        ```bash
        npm start # or yarn start
        ```
    The frontend will typically open in your browser at `http://localhost:3000`.

## API Endpoints

(Provide a brief overview of your main backend API endpoints - **These are examples, verify your actual endpoints**)

* `GET /api/reports/dimensions`: Get available reporting dimensions.
* `GET /api/reports/metrics`: Get available reporting metrics.
* `POST /api/reports/query`: Query paginated and sortable report data.
* `POST /api/reports/aggregate`: Get aggregated summary report data.
* `POST /api/reports/export`: Export report data to CSV.

**API Documentation (Swagger/OpenAPI - if implemented):**
If you have integrated Swagger/OpenAPI (e.g., using `springdoc-openapi-starter-webmvc-ui`), you can access the API documentation at:
* **Local:** `http://localhost:8091/swagger-ui.html`
* **Deployed:** `https://[your-render-backend-url].onrender.com/swagger-ui.html`

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

This project is primarily configured for continuous deployment with **Render**.

### Backend Deployment (Render)

Your Spring Boot backend is deployed as a Web Service on Render, leveraging a `Dockerfile`.

1.  **Connect your GitHub repository to Render:** If you haven't already, connect your `adtech-reporting-system` repository to your Render account.
2.  **Create a new Web Service:** In your Render dashboard, select "New Web Service".
3.  **Select your repository:** Choose `adtech-reporting-system`.
4.  **Configure the build settings:**
    * **Root Directory:** `backend` (This is crucial as your `Dockerfile` is inside the `backend` folder).
    * **Build Command:** `mvn clean package -DskipTests`
    * **Start Command:** `java -jar target/adtech-reportiningSystem-0.1.jar` (Verify `adtech-reportiningSystem-0.1.jar` matches the `artifactId` and `version` in your `backend/pom.xml`.)
    * **Environment:** Java
    * **Add Environment Variables:**
        * `DATABASE_URL`: `jdbc:postgresql://dpg-d2326mmmcj7s73d3eg2g-a.ohio-postgres.render.com/adtech_reporting_db` (Use the **internal connection string** provided by your Render PostgreSQL service.)
        * `DATABASE_USERNAME`: `adtech_user` (Use the username for your Render PostgreSQL database.)
        * `DATABASE_PASSWORD`: `RiIlPOhdy6sMeRGuqawpTl4MMI5NwVUX` (Use the password for your Render PostgreSQL database.)
        * `SPRING_PROFILES_ACTIVE`: `prod` (Optional, if you use a separate `application-prod.properties` for production settings)
        * `PORT`: `8091` (This is the port your Spring Boot app listens on. Render will typically expose it on port 80/443.)

    **IMPORTANT:** Ensure the `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` environment variables in Render exactly match the internal connection details of your PostgreSQL database deployed on Render.

5.  Render will automatically build and deploy your application on every push to the `main` branch. The backend will be accessible at `https://[your-render-backend-service-name].onrender.com`.

### PostgreSQL Database on Render

A managed PostgreSQL database instance is used for persistence.

1.  **Create a new PostgreSQL service** on Render.
2.  **Configure your database details:**
    * **Name:** `adtech-reporting-db` (or your preferred name)
    * **Database:** `adtech_reporting_db`
    * **User:** `adtech_user`
    * **Password:** `RiIlPOhdy6sMeRGuqawpTl4MMI5NwVUX` (Generate a strong password and save it securely!)
    * **Region:** Choose a region close to your web service (e.g., Ohio).
3.  **Note down the Internal Database URL, Username, and Password** provided by Render. These are the values you use for the environment variables in your backend web service.

### Frontend Deployment

The React frontend is typically deployed as a static site.

1.  **Build the React application for production:**
    ```bash
    cd frontend
    npm run build # or yarn build
    ```
    This creates an optimized `build` folder containing all static assets.

2.  **Choose a hosting provider:**
    * **Vercel / Netlify:** Highly recommended for easy CI/CD integration and static site hosting.
    * **Render Static Site:** You can also host the frontend as a static site on Render.

3.  **Configure environment variables for the frontend build:**
    If your frontend needs to know the deployed backend API URL, you'll pass it as an environment variable during the build process (e.g., `REACT_APP_API_URL` for Create React App).
    * Set `REACT_APP_API_URL` to `https://[your-render-backend-service-name].onrender.com/api` (or your specific base API path) in your frontend hosting provider's environment settings.

## Troubleshooting

* **`java.lang.RuntimeException: Driver org.postgresql.Driver claims to not accept jdbcUrl`:** This indicates an issue with your `spring.datasource.url` format or the environment variable setup in Render. **Ensure `application.properties` uses `${DATABASE_URL}` format and Render env vars are correctly set.**
* **`Cannot load driver class: org.postgresql.Driver`:** This means the PostgreSQL driver is not on the classpath. Verify your `backend/pom.xml` explicitly includes the `postgresql` dependency with `<scope>runtime</scope>`. If it's present, re-check Render logs for any build errors related to Maven downloading dependencies.
* **`No static resource [path]`:** This means your backend received a request for a path (e.g., `/dashboard`) for which it has no controller mapping and no corresponding static file (like `dashboard.html`). This often occurs when a frontend tries to access an endpoint that doesn't exist or is misconfigured.
* **`OutOfMemoryError` on Backend:** Ensure your database queries are optimized (indexes!), and increase JVM heap space (`-Xmx`). Large `findAll()` operations without pagination are a common cause.
* **Frontend Data Not Loading:** Check your browser's developer console for network errors (e.g., 404, 500, CORS). Ensure the frontend is pointing to the correct backend API URL. Check backend logs for incoming requests and errors.
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
