# Energy Anomaly Detector — Project Specification

## 1. Project Overview

**Project Name:** Energy Anomaly Detector  
**Type:** Full-stack web application with ML-powered analytics dashboard  
**Core Functionality:** Real-time monitoring and anomaly detection system for energy consumption data, designed for utility companies to identify irregularities, predict failures, and optimize energy distribution.  
**Target Users:** Energy sector analysts, grid operators, and facility managers at utilities like Iberdrola.

---

## 2. Description

The Energy Anomaly Detector is a comprehensive monitoring platform that ingests time-series energy consumption data from multiple sources, applies statistical anomaly detection algorithms, and presents actionable insights through an interactive Angular dashboard. The system processes historical and real-time data streams to detect consumption spikes, unusual patterns, and potential equipment failures before they escalate.

The application simulates realistic Iberdrola-style energy grid data, including transformer loads, substation consumption, residential meter readings, and industrial demand signals. The ML engine uses Isolation Forest and LSTM-based anomaly scoring to flag irregularities with configurable thresholds and severity levels.

---

## 3. Technology Stack

### Frontend
- **Framework:** Angular 17 (standalone components, signals API)
- **UI Library:** Angular Material with custom energy-sector theme
- **Charts:** Apache ECharts (high-performance time-series rendering)
- **State Management:** NgRx for global state, RxJS for reactive streams
- **Real-time:** WebSocket service for live data ingestion
- **Build Tool:** Angular CLI with esbuild

### Backend
- **Framework:** Spring Boot 3.2 (Java 17+)
- **API:** REST + WebSocket (STOMP protocol)
- **ML Engine:** Deep Java ML (DJML) — Isolation Forest + simple LSTM model
- **Data Processing:** Apache Flink for stream processing
- **Database:** PostgreSQL 15 (timescaleDB extension for time-series)
- **Cache:** Redis for session management and real-time caching
- **Authentication:** JWT with Spring Security

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **API Documentation:** OpenAPI 3.0 (Swagger)

---

## 4. Feature List

### Core Features
1. **Dashboard Overview** — Real-time KPI cards: total consumption, anomaly count, grid health score
2. **Time-Series Visualization** — Interactive multi-line charts for consumption trends with zoom, pan, brush selection
3. **Anomaly Detection Engine** — ML-based scoring with Isolation Forest and rule-based thresholds
4. **Alert Management** — Configurable alert rules, severity levels (INFO/WARNING/CRITICAL), notification channels
5. **Source Management** — Register and manage data sources (meters, sensors, substations)
6. **Historical Analysis** — Query and filter historical data with configurable time ranges
7. **Anomaly Detail View** — Drill-down into flagged anomalies with contributing factors, affected assets, recommended actions
8. **Report Generation** — Export anomaly reports as PDF or CSV
9. **User Authentication & RBAC** — Role-based access control (Admin, Operator, Viewer)
10. **Notification System** — Email and in-app notifications for critical anomalies

### ML Features
- Anomaly score computation per data point (0.0–1.0 scale)
- Model retraining trigger based on data drift detection
- Feature importance analysis for explainability
- Batch scoring for historical data reanalysis

---

## 5. Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Angular Frontend                              │
│   (Dashboard, Charts, Alert Management, User Management)            │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ REST + WebSocket (STOMP)
┌──────────────────────────────▼───────────────────────────────────────┐
│                     Spring Boot API Gateway                          │
│           (Authentication, Authorization, Routing)                    │
└────────────┬───────────────────┬────────────────────┬────────────────┘
             │                   │                    │
    ┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
    │  Anomaly Engine │ │  Data Ingestion  │ │  Alert Service  │
    │  (ML Processing)│ │  (REST + WS)     │ │  (Notifications)│
    └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
             │                   │                    │
    ┌────────▼──────────────────▼────────────────────▼────────┐
    │              PostgreSQL (TimescaleDB) + Redis             │
    │         (Time-series data, anomaly scores, cache)         │
    └───────────────────────────────────────────────────────────┘
```

### Key Components

**Frontend (Angular)**
- `core/` — Services, guards, interceptors, base configuration
- `features/dashboard/` — Main dashboard with KPI cards and charts
- `features/anomalies/` — Anomaly list, detail view, filtering
- `features/alerts/` — Alert rules management, notification preferences
- `features/sources/` — Data source registration and monitoring
- `shared/` — Reusable components, pipes, directives

**Backend (Spring Boot)**
- `controller/` — REST endpoints for all resources
- `service/` — Business logic, ML orchestration
- `repository/` — JPA repositories for PostgreSQL
- `ml/` — Anomaly detection algorithms (Isolation Forest, LSTM scorer)
- `websocket/` — STOMP endpoint for real-time updates
- `security/` — JWT authentication, role-based authorization

### Data Model

**DataSource**
- id (UUID), name, type (METER/SENSOR/SUBSTATION), location, status, createdAt

**EnergyReading**
- id (UUID), sourceId (FK), timestamp, consumptionKwh, voltage, frequency, anomalyScore

**AnomalyEvent**
- id (UUID), readingId (FK), score, severity, detectedAt, resolvedAt, description

**AlertRule**
- id (UUID), name, condition, threshold, severity, notificationChannels, enabled

---

## 6. Deliverables

1. **Source Code** — Complete Angular frontend and Spring Boot backend
2. **Docker Compose** — Full local development environment with PostgreSQL, Redis, and all services
3. **Database Schema** — SQL migration scripts for TimescaleDB setup
4. **API Documentation** — OpenAPI 3.0 spec with examples
5. **Test Suite** — Unit tests for services, integration tests for API, E2E tests for critical flows
6. **Deployment Scripts** — Helm charts for Kubernetes deployment
7. **README** — Setup instructions, architecture overview, API reference

---

## 7. Demo Description

The demo runs in a local Docker environment with simulated energy data.

**Login Screen:** The user authenticates with demo credentials (operator/operator123). The dashboard loads with a grid layout showing:

- **Top row:** 4 KPI cards — "Total Consumption Today: 847 MWh", "Active Anomalies: 12", "Grid Health: 94%", "Alerts Resolved Today: 8"
- **Main area:** A time-series line chart spanning 7 days of consumption data with a red highlighted anomaly region on day 3
- **Sidebar:** Scrollable list of recent anomalies with severity badges (3 critical in red, 5 warning in orange, 4 info in blue)
- **Real-time panel:** Live-updating consumption ticker showing current readings every 5 seconds

**Anomaly Detail:** Clicking an anomaly opens a slide-out panel showing:
- The consumption chart with the anomaly point highlighted
- Contributing factors: "Consumption spike 340% above baseline", "Affected 12 residential meters", "Similar pattern occurred 4 times this month"
- Recommended action: "Inspect transformer T-450 in substation S-Norte"
- One-click "Resolve" and "Escalate" buttons

**Alert Configuration:** A modal form to create alert rules with dropdowns for metric, condition (above/below/change), threshold value, and severity selection.

**Data Source Map:** A schematic view of the energy grid with color-coded nodes (green=normal, yellow=warning, red=critical) representing substations and meters.