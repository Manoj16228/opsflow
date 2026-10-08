# OpsFlow REST API Documentation

## 1. Overview
The OpsFlow REST API follows standard RESTful principles, is versioned under `/api/v1/`, and returns predictable JSON payloads.

Interactive OpenAPI 3.0 documentation with Swagger UI is hosted directly at:
```
http://localhost:5000/api-docs
```

---

## 2. Standard Response Envelopes

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 85,
    "totalPages": 5
  },
  "message": "Operation completed successfully."
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Task with identifier 'TSK-1042' was not found.",
    "details": []
  }
}
```

---

## 3. Core Endpoint Catalog

### Authentication
- `POST /api/v1/auth/register`: Provision new tenant and admin user.
- `POST /api/v1/auth/login`: Authenticate email/password $\rightarrow$ returns access & refresh tokens.
- `POST /api/v1/auth/refresh`: Rotate refresh token and issue new access token.
- `POST /api/v1/auth/logout`: Revoke active refresh token.
- `GET /api/v1/auth/me`: Fetch authenticated user profile & tenant scope.

### Tasks & SLA
- `GET /api/v1/tasks`: Filter by `status`, `priority`, `departmentId`, `assignedToId`, `search`, `page`, `limit`.
- `POST /api/v1/tasks`: Create task with SLA computation.
- `GET /api/v1/tasks/:id`: Task details with discussion feed and audit timeline.
- `PATCH /api/v1/tasks/:id`: Update task metadata.
- `PATCH /api/v1/tasks/:id/status`: Update status, compute SLA breach if completed past deadline.
- `POST /api/v1/tasks/:id/comments`: Add discussion comment.

### Incidents & SLA Command
- `GET /api/v1/incidents`: Filter by `severity`, `status`, `departmentId`, `assignedEmployeeId`.
- `POST /api/v1/incidents`: Report operational outage and start SLA countdown clock.
- `GET /api/v1/incidents/:id`: Incident triage details.
- `PATCH /api/v1/incidents/:id/status`: Mark as Investigating/Resolved/Closed with resolution notes.
- `POST /api/v1/incidents/:id/comments`: Post to live war room.

### Employees & Workload
- `GET /api/v1/employees`: List staff roster with active capacity meters.
- `POST /api/v1/employees`: Register new employee.
- `GET /api/v1/employees/:id`: Employee performance scorecards and SLA stats.
- `PATCH /api/v1/employees/:id`: Update employee details.

### Executive Analytics
- `GET /api/v1/analytics/overview`: Top 6 KPI cards.
- `GET /api/v1/analytics/tasks`: Priority, status, and 7-day velocity trends.
- `GET /api/v1/analytics/incidents`: Severity matrix and SLA compliance rates.
- `GET /api/v1/analytics/workload`: Workforce capacity telemetry.

### Compliance Audit Logs
- `GET /api/v1/audit-logs`: Query immutable audit trail (Admin only).
