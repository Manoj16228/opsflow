# Authentication & Multi-Tenant RBAC Security

## 1. Authentication Architecture

OpsFlow implements a secure stateless JWT (JSON Web Token) authentication architecture paired with persistent database-backed Refresh Token rotation.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant Auth as Auth Controller & Service
    participant DB as PostgreSQL Database
    participant API as Protected API Endpoints

    User->>Auth: POST /api/v1/auth/login (email, password)
    Auth->>DB: Query user by email & verify bcrypt hash
    Auth->>DB: Store hashed Refresh Token (7-day validity)
    Auth-->>User: Return Access Token (15-min) + Refresh Token
    User->>API: GET /api/v1/tasks (Authorization: Bearer <AccessToken>)
    API->>API: Verify token signature & decode claims (userId, role, organizationId)
    API-->>User: 200 OK + Scoped Tenant Data
```

## 2. Refresh Token Rotation

When the 15-minute access token expires:
1. Axios interceptor intercepts the `401 Unauthorized` response.
2. Sends `POST /api/v1/auth/refresh` with the stored refresh token.
3. The server validates token expiration, revokes the old refresh token, and issues a new pair.
4. The client automatically replays the original API request.

## 3. RBAC Capabilities

- **`ADMIN`**: Complete tenant ownership, organization branding, user management, audit logs, and global analytics.
- **`MANAGER`**: Team workload allocation, task creation, incident triage, and department telemetry.
- **`EMPLOYEE`**: Access to assigned work items, incident reporting, status transitions, and personal performance scorecards.
- **`ANALYST`**: Read-only access to analytics dashboards and Power BI exports.
