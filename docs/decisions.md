# Architectural Decisions & Tradeoffs (ADR)

## ADR-001: Backend Framework & Language
- **Decision**: Node.js with TypeScript and Express.js.
- **Rationale**: Express.js is mature, lightweight, un-opinionated, and when paired with modular architectural patterns, strict TypeScript typing, and Zod validation, provides rock-solid enterprise performance and predictable developer velocity.
- **Tradeoffs**: Requires explicit architectural discipline for modular boundaries (which we enforce via clean layer separation).

## ADR-002: Relational Database & ORM
- **Decision**: PostgreSQL with Prisma ORM.
- **Rationale**: PostgreSQL offers robust relational integrity, ACID compliance, JSONB support for audit log metadata, and strong indexing capabilities. Prisma provides type-safe query generation, intuitive schema definition, and predictable migrations.
- **Tradeoffs**: Complex analytical queries can sometimes require raw SQL or dedicated OLAP tables, which we solve via a dedicated Star Schema ETL tier in Python.

## ADR-003: Multi-Tenancy Strategy
- **Decision**: Row-level tenant isolation using foreign key `organizationId` across all entity tables, paired with strict query-level middleware enforcement and tenant validation.
- **Rationale**: Balances operational simplicity, ease of database migrations, low infrastructure overhead, and robust data isolation for SaaS tiering.
- **Security Guard**: Database access repositories reject queries without valid `organizationId` matching token claims.

## ADR-004: Real-time Communication
- **Decision**: Socket.IO with WebSocket fallback and room-based authorization.
- **Rationale**: Socket.IO automatically handles reconnection, heartbeat, room segregation per tenant and per entity, and graceful degradation.

## ADR-005: Caching & Asynchronous Processing
- **Decision**: Redis with BullMQ.
- **Rationale**: Decouples latency-sensitive write operations (e.g. sending emails, calculating heavy analytical rollups, SLA breach alarms) from user-facing API request-response loops. Provides automatic retry mechanisms, exponential backoff, and dead-letter queues.

## ADR-006: Data Engineering & Analytics Tier
- **Decision**: Standalone Python ETL pipelines using Pandas & SQLAlchemy to extract from operational PostgreSQL and build dimensional Star Schema tables (`fact_*`, `dim_*`).
- **Rationale**: Allows analytical workloads and Power BI DirectQuery to run without degrading transactional OLTP performance.

## ADR-007: Frontend Stack & State Management
- **Decision**: React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query + React Router + Lucide Icons + Recharts.
- **Rationale**: TanStack Query handles server state caching, background revalidation, and optimistic updates seamlessly. Tailwind CSS ensures a design-tokenized, modern enterprise design without bloated CSS. Vite provides blazing fast builds.
