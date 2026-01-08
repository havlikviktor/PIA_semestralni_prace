# PIA Translation System

A full-stack Translation Management System designed to facilitate workflows between Customers, Translators, and Administrators. The application allows users to create projects, manage translation tasks, and track progress with role-based access control and internationalization support.

## Features

*   **Role-Based Access Control:**
    *   **Administrator:** Manage users, oversee all projects, and configure system settings.
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
├── docker-compose.test.yml # Docker services for testing
└── .env.*                  # Environment configuration files
```

## Prerequisites

*   [Docker](https://www.docker.com/) and Docker Compose
*   [Node.js](https://nodejs.org/) (v20+ recommended for local non-Docker dev)

## Configuration

The project uses `.env` files for configuration. Ensure the following environment variables are set in your `.env` (or use the provided `.env.backend.dev` / `.env.frontend.dev` defaults).

### Backend Variables

| Variable | Description | Default (Dev) |
| :--- | :--- | :--- |
| `POSTGRES_HOST` | Database host | `db-dev` |
| `POSTGRES_PORT` | Database port | `5432` |
| `POSTGRES_USER` | Database user | `myuser` |
| `POSTGRES_PASSWORD` | Database password | `mypassword` |
| `POSTGRES_DB` | Database name | `mydb` |
| `ADMIN_PASSWORD` | Seed admin password | `admin123` |
| `JWT_SECRET` | Secret for signing tokens | `[SECRET]` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `...` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | `...` |
| `MAIL_HOST` | SMTP Host | `mailhog-dev` |
| `MAIL_PORT` | SMTP Port | `1025` |

### Frontend Variables

| Variable | Description | Default (Dev) |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SERVER_IP` | Backend IP/Host for client | `localhost` |

## Running the Project

### Using Docker Compose (Recommended)

1.  **Start the development environment:**
    ```bash
    docker-compose -f docker-compose.dev.yml up --build
    ```

2.  **Access the applications:**
    *   **Frontend:** [http://localhost:3000](http://localhost:3000)
    *   **Backend API:** [http://localhost:4000/api](http://localhost:4000/api) (Swagger UI)
    *   **MailHog UI:** [http://localhost:8025](http://localhost:8025)

### Default Credentials

*   **Admin Email:** `admin@pia.com`
*   **Admin Password:** `admin123` (or value of `ADMIN_PASSWORD`)

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