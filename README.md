# Enterprise IT Service Desk & Asset Management System

> [!IMPORTANT]
> **CONFIDENTIAL & PROPRIETARY**  
> This software, codebase, and associated documentation are strictly confidential and the proprietary intellectual property of the organization. Unauthorized viewing, reproduction, copying, distribution, modification, or disclosure of any part of this repository to any unauthorized third party without prior written authorization is strictly prohibited.

---

## 1. Project Overview

This repository contains a full-stack, enterprise-grade **IT Helpdesk & Asset Management System** designed for high-availability IT Shared Services operations.

* **Architecture**: Decoupled Client-Server Architecture
* **Frontend**: React.js (Vite) + Tailwind CSS (Responsive Dashboard, Incident Cockpit, BAST Generator)
* **Backend**: Node.js + Express.js RESTful API
* **ORM & Database**: Prisma ORM with PostgreSQL (Connection Pooling via PgBouncer)
* **Authentication**: JSON Web Token (JWT) with Role-Based Access Control (RBAC)
* **Notification Engine**: Automated SMTP Service for lifecycle ticket notifications

---

## 2. Directory Structure

```text
├── backend/                  # RESTful API Server (Node.js / Express)
│   ├── api/                  # Core modules & notification handlers
│   ├── controllers/          # Business logic controllers
│   ├── middleware/           # JWT auth guards & role validators
│   ├── prisma/               # Database schema & seed configurations
│   └── routes/               # Modular REST endpoints
├── frontend/                 # Client Single Page Application (React / Vite)
│   ├── src/
│   │   ├── components/       # Reusable UI components & modals
│   │   ├── hooks/            # Custom domain hooks
│   │   └── pages/            # View pages (Tickets, Assets, KPI, Users)
├── docker-compose.yml        # Containerized orchestration setup
└── README.md                 # Project technical documentation
```

---

## 3. Environment Configuration (`.env`)

Create a `.env` file in the `backend/` directory referencing the template below. Replace all dummy values with your verified infrastructure credentials:

```env
# Database Connection Strings (PostgreSQL)
DATABASE_URL="postgresql://user:password@db-host:6543/dbname?pgbouncer=true&schema=helpdesk"
DIRECT_URL="postgresql://user:password@db-host:5432/dbname?schema=helpdesk"

# Authentication Security
JWT_SECRET="your_secure_random_jwt_secret_key"

# Server Port
PORT=5000

# Automated Notification SMTP Configuration
SMTP_HOST="smtp.mailserver.com"
SMTP_PORT=465
SMTP_USER="helpdesk@company.internal"
SMTP_PASS="your_secure_smtp_app_password"
SMTP_FROM="helpdesk@company.internal"
```

---

## 4. Local Development Setup

### Backend Initialization
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Push schema changes & generate Prisma Client
npx prisma db push
npx prisma generate

# Seed initial baseline reference data
npm run prisma:seed

# Launch development server
npm run dev
```
*API service will start on `http://localhost:5000`.*

### Frontend Initialization
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Launch frontend application
npm run dev
```
*Web client will start on `http://localhost:5173`.*

---

## 5. Core Operational Capabilities

* **Incident & Ticket Lifecycle Management**: Multi-tier priority management (Critical, High, Medium, Low) with automated SLA countdown timers and retro-active backdating.
* **Asset & Device Inventory Management**: Complete hardware specification tracking, lifecycle audit history, and one-click BAST (Berita Acara Serah Terima) PDF/print generator.
* **Automated Email Notifications**: Real-time dispatched alerts for ticket issuance, engineer assignment, status progression, and mandatory resolution notes.
* **Role-Based Access Control**: Tiered permission policies for End Users, Support Engineers/Agents, and Enterprise Administrators.
* **Executive KPI & Reporting**: Performance dashboards tracking SLA resolution ratios, mean time to respond (MTTR), and agent resolution statistics.

---

## 6. Security & Compliance Notice

* All production passwords, API tokens, and secret keys must be managed exclusively through secure environment variables (`.env`) or enterprise secret vaults.
* Committing credentials, private certificates, customer identifying data, or sensitive employee records to version control is strictly forbidden.
