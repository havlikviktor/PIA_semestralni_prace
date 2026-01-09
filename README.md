# PIA Translation System

A full-stack Translation Management System designed to facilitate workflows between Customers, Translators, and Administrators. The application allows users to create projects, manage translation tasks, and track progress with role-based access control and internationalization support.

## Features

*   **Role-Based Access Control:**
    *   **Administrator:** Manage users and oversee all projects.
    *   **Customer:** Create new translation projects, upload files, and track status.
    *   **Translator:** View assigned projects, download source files, and upload completed translations.
*   **Project Management:** Dashboard for tracking active, pending, and completed projects.
*   **Authentication:** Secure login via Email/Password and Google OAuth.
*   **Internationalization (i18n):** Multi-language interface support (English/Czech).
*   **Email Notifications:** Automated emails for project updates (integrated with MailHog for development).
*   **File Handling:** Secure upload and download of project assets.

## Tech Stack

**Backend**
*   **Framework:** [NestJS](https://nestjs.com/) (Node.js/TypeScript)
*   **Database:** PostgreSQL with [TypeORM](https://typeorm.io/)
*   **Authentication:** Passport.js (JWT & Google OAuth Strategies)
*   **Testing:** Jest (Unit & E2E)
*   **Documentation:** Swagger/OpenAPI

**Frontend**
*   **Framework:** [Next.js 16](https://nextjs.org/) (React 19)
*   **Styling:** Tailwind CSS
*   **Language:** TypeScript
*   **i18n:** next-intl

**DevOps & Tools**
*   **Containerization:** Docker & Docker Compose
*   **Email Testing:** MailHog

## Project Structure

```text
.
├── backend/                # NestJS Backend application
│   ├── src/
│   │   ├── config/         # Database and TypeORM config
│   │   ├── database/       # Migrations and Seeds
│   │   ├── modules/        # Feature modules (Auth, User, Project, etc.)
│   │   └── main.ts         # Entry point
│   └── test/               # E2E tests
├── frontend/               # Next.js Frontend application
│   ├── app/                # App Router (Next.js 13+) with i18n
│   ├── components/         # Reusable UI components
│   └── messages/           # Translation JSON files
├── docker-compose.dev.yml  # Docker services for development
├── docker-compose.prod.yml # Docker services for production
├── docker-compose.test.yml # Docker services for testing
└── .env.*                  # Environment configuration files
```

## Docker Infrastructure

The project includes three distinct Docker Compose configurations tailored for different stages of the development lifecycle:

*   **docker-compose.dev.yml:** Optimized for active development. Features hot-reloading for both backend and frontend, and includes **MailHog** for intercepting and viewing outgoing emails locally.
*   **docker-compose.prod.yml:** Designed for production-like environments. Uses optimized Dockerfiles and environment variables suited for stability and performance. It utilizes **server.js** to handle production-grade serving and proxying.
*   **docker-compose.test.yml:** Specialized setup for executing automated tests. It spins up a dedicated test database and application environment, ensuring tests run in isolation without affecting development or production data.

## Prerequisites

*   [Docker](https://www.docker.com/) and Docker Compose
*   [Node.js](https://nodejs.org/) (v20+ recommended for local non-Docker dev)

## Configuration

The project utilizes a structured environment configuration system. Environment variables are split across several files, each mapped to specific Docker Compose configurations:

*   **.env (Root):** Primary configuration for container orchestration, including shared service ports and database credentials used by Docker Compose.
*   **.env.backend.dev / .env.frontend.dev:** Application-specific settings for the development environment (used by `docker-compose.dev.yml`).
*   **.env.backend.prod / .env.frontend.prod:** Application-specific settings for the production environment (used by `docker-compose.prod.yml`).
*   **.env.test:** Dedicated configuration for running E2E and unit tests (used by `docker-compose.test.yml`).

Ensure the relevant variables are set in these files before starting the services.

### 1. Orchestration & Shared Services (`.env`)
These variables configure the Docker containers, ports, and database credentials used by `docker-compose`.

| Variable | Description | Default (Dev) |
| :--- | :--- | :--- |
| `POSTGRES_PORT` | Host port for Database | `5432` |
| `BACKEND_PORT` | Host port for Backend ([NestJS](https://nestjs.com/)) | `3000` |
| `FRONTEND_PORT` | Host port for Frontend ([Next.js 16](https://nextjs.org/)) | `3000` |
| `MAIL_PORT` | Host port for SMTP | `1025` |
| `MAIL_PORT` | Host port for SMTP | `1025` |
| `UI_PORT` | Host port for MailHog UI | `8025` |

### 2. Backend Application (`.env.backend.dev` / `.env.backend.prod`)
Configuration specific to the NestJS application logic.

| Variable | Description | Default (Dev) |
| :--- | :--- | :--- |
| `ADMIN_PASSWORD` | Password for the seeded Admin user | `admin123` |
| `POSTGRES_HOST` | Database container hostname | `db-dev` |
| `POSTGRES_USER` | Shared Database user | `myuser` |
| `POSTGRES_PASSWORD` | Shared Database password | `mypassword` |
| `POSTGRES_DB` | Shared Database name | `mydb` |
| `MAIL_HOST` | MailHog container hostname | `mailhog-dev` |
| `JWT_SECRET` | Secret key for signing JWTs | `[SECRET]` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `...` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | `...` |
| `GOOGLE_CALLBACK_URL` | Backend URL for Google OAuth callback | `http://localhost:3000/auth/google/callback` |
| `FRONTEND_URL` | Frontend URL for redirects after Auth | `http://localhost:4000/en/google-auth` |

### 3. Frontend Application (`.env.frontend.dev` / `.env.frontend.prod`)
Configuration specific to the Next.js frontend application.

| Variable | Description | Default (Dev) |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SERVER_IP` | Backend API address accessible by the client | `localhost` |

## Running the Project

### 1. Development Environment (`docker-compose.dev.yml`)
Use this for active development. It enables hot-reloading for both frontend and backend, and includes MailHog for email testing.

**Execution:**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

**Access:**
*   **Frontend:** [http://localhost:3000](http://localhost:3000)
*   **Backend API:** [http://localhost:4000/api](http://localhost:4000/api)
*   **MailHog:** [http://localhost:8025](http://localhost:8025)

### 2. Production Environment (`docker-compose.prod.yml`)
Use this to simulate a production deployment. It builds optimized, immutable images without hot-reloading.
**Note:** The default admin account is seeded **only** in this environment.

**Execution:**
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

**Default Admin Credentials (Prod Only):**
*   **Email:** `admin@pia.com`
*   **Password:** `admin123` (or value of `ADMIN_PASSWORD`)

### 3. Test Environment (`docker-compose.test.yml`)
Use this to execute End-to-End (E2E) tests. It spins up an isolated database and backend, runs the test suite, and then shuts down automatically.

**Execution:**
```bash
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

## Testing

The project includes E2E tests for the backend.

### Running Tests (Windows)
A convenience script is provided to run unit tests and then execute E2E tests in a Docker container:
```batch
.\run-tests.bat
```

### Running Tests (Manual / Docker)
To run E2E tests manually using Docker Compose:
```bash
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
```

### Running Tests (Local)
To run unit tests locally within the `backend` directory:
```bash
cd backend
npm install
npm run test
```

## Scripts & Commands

**Backend (`/backend`)
*   `npm run start:dev`: Start backend in watch mode.
*   `npm run lint`: Run ESLint.
*   `npm run typeorm`: Run TypeORM CLI commands.
*   `npm run migration:run`: Execute pending migrations.

**Frontend (`/frontend`)
*   `npm run dev`: Start frontend dev server.
*   `npm run lint`: Run ESLint.
*   `npm run build`: Build for production.

## API Documentation

The backend provides a Swagger UI for exploring the API endpoints.
Once the application is running, visit:
**[http://localhost:4000/api](http://localhost:4000/api)**

```