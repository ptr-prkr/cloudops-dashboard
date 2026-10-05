# CloudOps Dashboard

A full-stack operations dashboard built with **React, TypeScript, Node.js and Express**, designed to expose live infrastructure and service-health information through a typed REST API.

The project combines software engineering with DevOps principles: a React frontend consumes real operational data from a TypeScript backend, while the backend monitors the host system and supporting services.

![CloudOps Dashboard](screenshots/01-cloudops-dashboard.png)

## Overview

CloudOps Dashboard provides a single operational view of:

- overall platform health
- host and operating-system information
- system uptime
- memory utilisation
- individual service health
- deployment metadata
- infrastructure information

The dashboard automatically refreshes its operational data every 10 seconds.

## Technology Stack

### Frontend

- React 19
- TypeScript
- Vite
- CSS
- Fetch API
- ESLint

### Backend

- Node.js 24
- Express
- TypeScript
- REST API
- Node.js OS APIs
- Docker Engine API
- systemd service checks

### DevOps and Infrastructure

- Linux
- Docker
- nginx
- Git
- AWS deployment planned

## Architecture

```text
React + TypeScript + Vite
          │
          │ Typed REST API
          ▼
Node.js + Express + TypeScript
          │
          ├── Linux system metrics
          ├── Docker Engine health
          ├── nginx service health
          └── Frontend health
```

The frontend and backend use matching TypeScript data models for dashboard information, including system metrics, deployment metadata, infrastructure status and monitored services.

The current development version runs on a Linux host. Docker containerisation, nginx reverse proxying and AWS deployment will be added in the next stages of the project.

## Live Monitoring

The backend collects operational information directly from the host rather than returning a static dashboard.

Current monitoring includes:

| Component | Monitoring method |
| --- | --- |
| Frontend | HTTP health request |
| API | Active API request |
| Docker | Docker Engine Unix socket |
| nginx | systemd service state |
| System | Node.js OS APIs |

If a monitored service becomes unavailable, the dashboard automatically reflects the failure and changes the overall platform state to **degraded**.

### Failure Detection

The following screenshot demonstrates deliberately stopped services being detected by the dashboard while the terminal provides supporting service-state evidence.

![Broken services with terminal evidence](screenshots/02-broken-services-with-terminal.png)

This demonstrates that the service-health indicators are driven by live backend monitoring rather than hard-coded frontend values.

## REST API

The Express backend currently exposes two endpoints:

```text
GET /api/health
GET /api/dashboard
```

`GET /api/health` provides a lightweight API health check.

`GET /api/dashboard` returns structured operational information including:

- hostname
- Linux kernel and platform
- architecture
- uptime
- memory usage
- deployment information
- infrastructure information
- individual service states
- service check response times

### Live API Monitoring Data

![Live API monitoring data](screenshots/03-live-api-monitoring-data.png)

The React application consumes this API through a typed service layer and automatically requests fresh dashboard data every 10 seconds.

## TypeScript Data Contract

The application uses explicit TypeScript interfaces to define its operational data model.

```text
DashboardData
├── status
├── system
│   ├── hostname
│   ├── platform
│   ├── architecture
│   ├── uptime
│   ├── memoryUsed
│   └── memoryTotal
├── deployment
├── infrastructure
└── services[]
```

This provides compile-time type checking across the application and makes the expected API contract clear and maintainable.

## Failure Detection and Recovery

The monitoring layer was tested by deliberately stopping nginx on the Linux host.

The dashboard detected the service failure during its next refresh cycle, changed the nginx service state to **offline**, and changed the overall platform state to **degraded**.

After nginx was restarted, the dashboard automatically detected its recovery and returned the service and platform indicators to **operational**.

This validates the complete monitoring path:

```text
Service state changes
        │
        ▼
Backend health check
        │
        ▼
REST API response
        │
        ▼
React polling hook
        │
        ▼
Dashboard updates
```

## Development

### Backend

Install dependencies and start the development server:

```bash
cd backend
npm install
npm run dev
```

The backend listens on:

```text
http://localhost:5000
```

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs on:

```text
http://localhost:5173
```

## Quality Checks

The frontend is validated with ESLint and a production TypeScript/Vite build:

```bash
cd frontend
npm run lint
npm run build
```

The backend is validated with TypeScript type checking and a production build:

```bash
cd backend
npm run typecheck
npm run build
```

Both frontend and backend currently pass their respective validation and production build processes.

## Project Structure

```text
cloudops-dashboard/
├── backend/
│   └── src/
│       ├── routes/
│       ├── services/
│       ├── types/
│       └── server.ts
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       ├── App.tsx
│       └── main.tsx
│
├── screenshots/
│   ├── 01-cloudops-dashboard.png
│   ├── 02-broken-services-with-terminal.png
│   └── 03-live-api-monitoring-data.png
│
├── .gitignore
└── README.md
```

## Deployment Roadmap

The current development version runs on a Linux host and provides live monitoring of the local environment.

The next stages will extend the project with:

- Docker containerisation
- production React build
- nginx reverse proxy
- container networking
- AWS networking
- IAM
- EC2
- DNS
- cloud security configuration

The architecture and documentation will be updated as each deployment layer is implemented and validated.

## What This Project Demonstrates

This project combines application development and infrastructure engineering in one practical project.

It currently demonstrates:

- React component architecture
- TypeScript interfaces and type safety
- asynchronous REST API integration
- React hooks and state management
- automatic frontend polling
- Node.js and Express API development
- Linux system information collection
- service-health monitoring
- Docker Engine integration
- systemd integration
- failure detection and recovery
- frontend and backend production build validation
- infrastructure-oriented application design

Further stages will extend the same application into containerisation, reverse proxying and AWS infrastructure.

---

**CloudOps Dashboard** — React · TypeScript · Node.js · Express · Docker · nginx · Linux · AWS