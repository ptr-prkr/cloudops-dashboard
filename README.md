# CloudOps Dashboard

A full-stack operations dashboard built with **React, TypeScript, Node.js and Express**, containerised with **Docker**, served through an **nginx reverse proxy**, and deployed to **AWS using Terraform and Ansible**.

The project combines software engineering, DevOps, infrastructure as code and cloud engineering. A React frontend consumes live operational data from a typed REST API, while the backend collects system and service-health information and exposes deployment and infrastructure metadata.

The application supports local development, a production-style multi-container deployment on Linux, and an automated AWS deployment.

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
- service response times

The React application automatically requests fresh operational data every 10 seconds.

The project was designed not only to display infrastructure information, but also to demonstrate how application development, monitoring, containerisation, infrastructure as code, configuration management, networking and cloud deployment can work together in a complete system.

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
- Docker Compose
- Multi-stage Docker builds
- nginx
- Docker bridge networking
- Container health checks
- Terraform
- Ansible
- AWS
- Amazon EC2
- Amazon VPC
- IAM
- Security Groups
- Git

## Architecture

The project supports three execution models: local development, local containerised deployment and AWS production deployment.

### Development Architecture

During development, Vite serves the React application and proxies API requests to the Express backend.

```text
Browser
   |
   v
React + TypeScript
Vite :5173
   |
   | /api/*
   v
Node.js + Express + TypeScript
:5000
   |
   +-- Linux system metrics
   +-- Docker Engine health
   +-- nginx service health
   +-- Frontend health
```

The Vite development proxy allows the frontend to use relative API paths such as:

```text
/api/dashboard
```

rather than hard-coding a backend hostname or port into the React application.

### Containerised Architecture

The production-style local deployment uses separate frontend and backend containers connected through a private Docker bridge network.

```text
Browser
   |
   | :8080
   v
Frontend Container
nginx :80
   |
   +-- React production build
   |
   | /api/*
   v
cloudops-network
   |
   v
Backend Container
Express :5000
```

Only the nginx frontend is published to the host:

```text
Host :8080 -> frontend :80
```

The backend port is not published to the host. nginx reaches the Express service through Docker's internal DNS using:

```text
backend:5000
```

This keeps the API behind the application's reverse proxy rather than exposing it directly.

### AWS Architecture

The cloud deployment extends the same container architecture into AWS.

```text
Internet
   |
   | HTTP :80
   v
AWS Security Group
   |
   v
EC2 - Ubuntu 24.04
   |
   v
Docker Compose
   |
   +---------------------------+
   |                           |
   v                           v
Frontend Container        Backend Container
nginx :80                 Express :5000
React production build    TypeScript API
   |                           ^
   | /api/*                    |
   +------ Docker network -----+
```

Terraform provisions the AWS infrastructure, while Ansible configures the EC2 operating system and deploys the application.

The public entry point is nginx on port 80. The Express backend remains private and is accessible only through the Docker network.

## TypeScript Data Contract

The frontend and backend use matching TypeScript data models for operational information.

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
│   ├── environment
│   ├── version
│   ├── deployedAt
│   └── deployedBy
├── infrastructure
│   ├── provider
│   ├── region
│   ├── instance
│   └── network
└── services[]
    ├── name
    ├── status
    └── responseTime
```

Explicit interfaces provide compile-time type checking and make the expected API contract clear and maintainable.

## Live Monitoring

The backend collects operational information rather than returning a static dashboard.

The monitoring strategy changes depending on how the application is running.

### Host Development Mode

When running directly on the Linux host, monitoring includes:

| Component | Monitoring method |
| --- | --- |
| Frontend | HTTP health request |
| API | Active API state |
| Docker | Docker Engine Unix socket |
| nginx | systemd service state |
| System | Node.js OS APIs |

This mode allows the dashboard to monitor services running directly on the Linux server.

### Container Mode

When running through Docker Compose, the backend operates in container-aware monitoring mode.

The application monitors the frontend/nginx service over the private Docker network while avoiding a Docker socket mount inside the backend container.

This deliberately avoids granting the application container control over the host Docker daemon.

## Failure Detection

The host monitoring implementation was tested by deliberately stopping monitored services.

The dashboard detected the service failure, changed the affected service state to **offline**, and changed the overall platform state to **degraded**.

![Broken services with terminal evidence](screenshots/02-broken-services-with-terminal.png)

This demonstrates that the service-health indicators are driven by live backend monitoring rather than hard-coded frontend values.

## REST API

The Express backend exposes two primary endpoints:

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

The React application consumes the API through a typed service layer.

A custom React hook retrieves the initial dashboard state and automatically polls the API every 10 seconds for updated operational information.

## Docker Containerisation

Both application layers use multi-stage Docker builds.

### Backend Image

The backend Docker build uses a Node.js build stage to:

1. install dependencies
2. compile the TypeScript source
3. produce the JavaScript application in `dist/`

A separate production stage installs only production dependencies and copies the compiled application from the builder.

The final backend container runs as the non-root `node` user.

```text
Node 24 builder
      |
      | npm ci
      | TypeScript compilation
      v
    dist/
      |
      v
Node 24 production image
      |
      | production dependencies only
      v
node dist/server.js
```

### Frontend Image

The frontend also uses a multi-stage build.

Node.js and Vite compile the React/TypeScript application during the build stage. The resulting static files are copied into a separate nginx image.

```text
Node 24 builder
      |
      | npm ci
      | npm run build
      v
    dist/
      |
      v
nginx production image
      |
      v
React static application
```

Node.js is therefore required to build the frontend but is not required to serve the compiled React application in production.

## nginx Reverse Proxy

nginx performs two roles in the containerised deployment:

- serves the compiled React application
- proxies `/api/*` requests to the backend container

The browser communicates with one application entry point.

A frontend request such as:

```text
/api/dashboard
```

follows this path:

```text
Browser
   |
   v
nginx :80
   |
   | Docker internal DNS
   v
backend:5000
   |
   v
Express API
```

nginx also exposes a lightweight `/health` endpoint used by container health monitoring.

## Docker Compose

Docker Compose defines the complete containerised application.

```text
cloudops-dashboard
|
├── frontend
│   ├── nginx
│   ├── React production build
│   ├── health check
│   └── configurable published port
│
├── backend
│   ├── Node.js
│   ├── Express
│   ├── health check
│   └── private port 5000
│
└── cloudops-network
    └── private bridge network
```

Compose provides:

- image builds
- container configuration
- environment variables
- private networking
- service dependencies
- health checks
- restart policies
- configurable port publishing

The frontend host port is environment-driven:

```yaml
ports:
  - "${FRONTEND_PORT:-8080}:80"
```

This allows the same Compose configuration to use port `8080` locally and port `80` on AWS.

The complete stack can be built and started with:

```bash
docker compose up -d --build
```

Its state can be inspected with:

```bash
docker compose ps
```

## Container Health Checks

Both application containers have health checks.

The backend health check queries:

```text
http://127.0.0.1:5000/api/health
```

The frontend health check queries nginx:

```text
http://127.0.0.1/health
```

Docker Compose can therefore distinguish between a container process merely running and the application inside that container actually responding.

## Environment-Driven Configuration

Deployment metadata is supplied through environment variables rather than being hard-coded into the application.

Configuration includes:

```text
APP_ENVIRONMENT
APP_VERSION
DEPLOYED_BY
CLOUD_PROVIDER
CLOUD_REGION
INSTANCE_NAME
NETWORK_NAME
MONITORING_MODE
FRONTEND_HEALTH_URL
FRONTEND_PORT
```

This allows the same application and container architecture to represent different environments.

### Local Container Deployment

| Property | Value |
| --- | --- |
| Environment | `production` |
| Version | `1.0.0` |
| Deployment method | `docker-compose` |
| Provider | `docker` |
| Region | `local` |
| Instance | `node01` |
| Network | `cloudops-network` |

### AWS Deployment

| Property | Value |
| --- | --- |
| Environment | `production` |
| Version | `1.0.0` |
| Deployment method | `ansible` |
| Provider | `AWS` |
| Region | `eu-west-2` |
| Instance | `cloudops-dashboard-ec2` |
| Network | `cloudops-network` |

## Containerised Production Dashboard

The complete React, nginx and Express stack was first deployed locally through Docker Compose and validated through the nginx entry point.

![Containerised production dashboard](screenshots/04-containerised-production-dashboard.png)

The local container deployment confirms:

- production environment configuration
- Docker infrastructure metadata
- Docker Compose deployment metadata
- private application networking
- operational frontend service
- operational API service
- live system information

## Failure and Recovery Testing

Failure behaviour was tested in both the host and containerised architectures.

### Host Service Failure

During host-mode testing, nginx was deliberately stopped.

The backend detected the service failure during its next monitoring cycle, changed nginx to **offline**, and changed the overall platform status to **degraded**.

After nginx was restarted, the dashboard automatically detected its recovery.

### Container Backend Failure

The backend container was deliberately stopped while the frontend container remained running.

nginx continued serving the compiled React application, but API requests could no longer reach Express.

The reverse proxy correctly returned:

```text
502 Bad Gateway
```

The React application detected the failed API request and displayed an explicit error state rather than presenting misleading operational data.

![Backend failure handling](screenshots/05-backend-failure-502-handling.png)

After the backend container was restored and returned to a healthy state, the React polling mechanism successfully retrieved dashboard data again and restored the operational view.

The complete recovery path is:

```text
Backend unavailable
        |
        v
nginx upstream request fails
        |
        v
HTTP 502 Bad Gateway
        |
        v
React API request detects failure
        |
        v
Error state displayed
        |
        v
Backend restored
        |
        v
API becomes healthy
        |
        v
React polling succeeds
        |
        v
Dashboard recovers
```

This demonstrates the difference between frontend availability, backend availability and complete application availability.

## AWS Infrastructure with Terraform

The AWS infrastructure is defined as code using Terraform.

Terraform provisions:

- VPC
- public subnet
- Internet Gateway
- public route table
- route-table association
- Security Group
- EC2 SSH key pair
- IAM role
- IAM instance profile
- Ubuntu EC2 instance
- encrypted `gp3` root volume

The deployment uses AWS region:

```text
eu-west-2
```

The EC2 instance is deployed into a dedicated VPC and public subnet.

### EC2 Security

The EC2 configuration includes:

- encrypted root storage
- IMDSv2 enforcement
- IAM instance profile
- controlled Security Group ingress
- SSH public-key authentication

The Security Group permits:

```text
HTTP :80    -> public application access
SSH  :22    -> configurable administrator CIDR
```

There is deliberately no inbound Security Group rule for the Express backend on port `5000`.

Terraform was validated after deployment with:

```text
No changes. Your infrastructure matches the configuration.
```

This confirms that the deployed AWS resources matched the Terraform configuration at the final validation point.

## Automated Deployment with Ansible

Terraform is responsible for creating the infrastructure.

Ansible is responsible for configuring the EC2 operating system and deploying CloudOps Dashboard onto that infrastructure.

```text
Terraform
    |
    v
AWS infrastructure
    |
    v
Ubuntu EC2
    |
    v
Ansible
    |
    +-- install Docker
    +-- install Docker Compose
    +-- synchronise application source
    +-- configure deployment metadata
    +-- configure public port
    +-- build Docker images
    +-- start containers
    +-- verify HTTP health
    +-- verify dashboard API
```

Application source is synchronised to EC2 while generated development content such as `node_modules` and `dist` is excluded.

Docker then installs and builds the required application dependencies inside the appropriate image build stages.

The completed Ansible deployment reported:

```text
unreachable=0
failed=0
```

and verified:

```text
HTTP health status: 200
Dashboard status: operational
Environment: production
Provider: AWS
```

## AWS Production Deployment

The complete application was successfully deployed to AWS EC2 using the Terraform-created infrastructure and Ansible configuration.

![CloudOps Dashboard running on AWS](screenshots/06-aws-production-deployment.png)

The live dashboard reported:

- environment: `production`
- provider: `AWS`
- region: `eu-west-2`
- instance: `cloudops-dashboard-ec2`
- deployment method: `ansible`
- frontend: operational
- API: operational

### AWS Deployment Validation

The deployment was validated with:

- EC2 system status checks
- EC2 instance status checks
- SSH connectivity
- Ansible connectivity
- Ansible deployment with zero failed tasks
- Docker frontend health check
- Docker backend health check
- public `/health` request returning HTTP `200`
- live `/api/dashboard` request
- public port `5000` connectivity test
- Security Group inspection
- Terraform configuration-drift check

The public backend test confirmed:

```text
PASS: backend is NOT publicly reachable on :5000
```

The final Terraform plan confirmed:

```text
No changes. Your infrastructure matches the configuration.
```

## Security and Deployment Decisions

Several implementation decisions were made deliberately to reduce unnecessary exposure and keep the architecture closer to production practices.

### Private Backend

The Express backend is not published directly to the host or internet.

API traffic enters through nginx and travels to Express across the private Docker bridge network.

### Restricted SSH

SSH was initially enabled during infrastructure provisioning and then restricted to a configurable administrator `/32` CIDR.

The real administrator address is supplied through an untracked local Terraform variable file rather than being committed to the repository.

### Public HTTP Entry Point

Port 80 is intentionally publicly accessible so the demonstration application can be reached through nginx.

The current deployment uses HTTP rather than HTTPS. TLS termination and certificate management are outside the scope of this implementation.

### Non-Root Backend

The production backend container runs as the standard non-root Node.js user rather than root.

### No Docker Socket in Container Mode

The host-mode backend can inspect the Docker Engine through its Unix socket.

The containerised backend does not mount `/var/run/docker.sock`.

A Docker socket mount would give the application significant control over the host Docker daemon, so container mode instead uses network-based service health checks.

### IMDSv2

The EC2 instance requires IMDSv2 for access to the EC2 Instance Metadata Service.

### Encrypted Storage

The EC2 root volume uses encrypted `gp3` storage.

### IAM Instance Profile

The EC2 instance is associated with an IAM role through an instance profile, providing an AWS-native mechanism for granting instance permissions if required without embedding credentials in the application.

### Environment-Based Deployment Metadata

Deployment-specific values are supplied through environment variables rather than being embedded in application source code.

These decisions reduce unnecessary host exposure and make the application easier to move between environments.

## Development

### Backend

Install dependencies and start the backend development server:

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

During development, Vite proxies `/api/*` requests to the Express backend.

## Local Containerised Deployment

Build and start the complete application:

```bash
docker compose up -d --build
```

Check container state:

```bash
docker compose ps
```

View application logs:

```bash
docker compose logs
```

Follow logs continuously:

```bash
docker compose logs -f
```

Stop the application:

```bash
docker compose down
```

The local containerised application defaults to:

```text
http://localhost:8080
```

The backend remains internal to the Docker network and does not require a published host port.

## AWS Deployment Workflow

The cloud deployment follows this sequence:

```text
Terraform
   |
   | terraform init
   | terraform plan
   | terraform apply
   v
AWS infrastructure
   |
   v
Ansible
   |
   | connectivity test
   | deploy.yml
   v
Docker Compose on EC2
   |
   v
nginx / React / Express
   |
   v
Health and security validation
```

Terraform outputs the EC2 connection information required to generate the temporary Ansible inventory.

The generated inventory and environment-specific Terraform variable file are excluded from Git.

After portfolio validation, the AWS resources can be removed with:

```bash
terraform destroy
```

This keeps the demonstration reproducible without requiring the infrastructure to remain permanently provisioned.

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

The Compose configuration can be validated with:

```bash
docker compose config --quiet
```

Terraform can be validated with:

```bash
terraform -chdir=terraform fmt -check
terraform -chdir=terraform validate
terraform -chdir=terraform plan
```

The Ansible deployment can be syntax checked with:

```bash
ansible-playbook \
  -i ansible/inventory.ini \
  ansible/deploy.yml \
  --syntax-check
```

The project has been tested with:

- frontend lint validation
- frontend production build
- backend TypeScript type checking
- backend production build
- Docker image builds
- Docker Compose configuration validation
- frontend container health checks
- backend container health checks
- nginx reverse proxy requests
- API requests through nginx
- private backend networking
- deliberate service failure
- recovery testing
- Terraform validation
- Terraform planning and deployment
- Terraform drift detection
- Ansible connectivity
- automated Ansible deployment
- EC2 status checks
- AWS public HTTP access
- AWS Security Group validation
- restricted SSH access
- public backend exposure testing

## Project Structure

```text
cloudops-dashboard/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── server.ts
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── terraform/
│   ├── .terraform.lock.hcl
│   ├── main.tf
│   ├── outputs.tf
│   ├── terraform.tfvars.example
│   ├── variables.tf
│   └── versions.tf
│
├── ansible/
│   ├── ansible.cfg
│   └── deploy.yml
│
├── screenshots/
│   ├── 01-cloudops-dashboard.png
│   ├── 02-broken-services-with-terminal.png
│   ├── 03-live-api-monitoring-data.png
│   ├── 04-containerised-production-dashboard.png
│   ├── 05-backend-failure-502-handling.png
│   └── 06-aws-production-deployment.png
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

Generated or environment-specific deployment files such as `terraform.tfvars`, Terraform plan files and the generated Ansible inventory are intentionally excluded from version control.

## What This Project Demonstrates

CloudOps Dashboard combines software development, systems engineering, DevOps and cloud infrastructure in one practical project.

It demonstrates:

- React component architecture
- TypeScript interfaces and type safety
- asynchronous REST API integration
- React hooks and state management
- automatic frontend polling
- Node.js and Express API development
- Linux system information collection
- live service-health monitoring
- Docker Engine integration
- systemd integration
- failure detection and recovery
- multi-stage Docker builds
- production React compilation
- nginx static content serving
- nginx reverse proxying
- Docker Compose orchestration
- private Docker networking
- Docker internal DNS
- container health checks
- non-root backend execution
- environment-driven configuration
- service dependency management
- production build validation
- deliberate failure testing
- Terraform infrastructure as code
- AWS VPC networking
- EC2 provisioning
- Security Group configuration
- IAM roles and instance profiles
- encrypted EC2 storage
- IMDSv2 enforcement
- Ansible configuration management
- automated application deployment
- infrastructure drift validation
- cloud security validation
- controlled infrastructure teardown
- infrastructure-oriented application design

The project demonstrates the complete path from frontend and API development through containerisation, automated infrastructure provisioning, server configuration and deployment to a live AWS environment.

---

**CloudOps Dashboard** — React · TypeScript · Node.js · Express · Docker · Docker Compose · nginx · Linux · Terraform · Ansible · AWS