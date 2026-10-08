-- =============================================================================
-- OPSFLOW ANALYTICAL STAR SCHEMA DEFINITION (OLAP / Power BI Ready)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DIMENSION TABLES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS dim_organization (
    org_key SERIAL PRIMARY KEY,
    org_id VARCHAR(64) UNIQUE NOT NULL,
    org_name VARCHAR(128) NOT NULL,
    org_slug VARCHAR(128) NOT NULL,
    industry VARCHAR(64),
    plan_tier VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS dim_department (
    dept_key SERIAL PRIMARY KEY,
    dept_id VARCHAR(64) UNIQUE NOT NULL,
    org_id VARCHAR(64) NOT NULL,
    dept_name VARCHAR(128) NOT NULL,
    dept_code VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS dim_employee (
    emp_key SERIAL PRIMARY KEY,
    emp_id VARCHAR(64) UNIQUE NOT NULL,
    org_id VARCHAR(64) NOT NULL,
    dept_id VARCHAR(64),
    employee_code VARCHAR(32) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(128) NOT NULL,
    designation VARCHAR(128),
    status VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS dim_date (
    date_key INT PRIMARY KEY, -- Format YYYYMMDD
    full_date DATE NOT NULL,
    day_of_week INT NOT NULL,
    day_name VARCHAR(16) NOT NULL,
    day_of_month INT NOT NULL,
    month_number INT NOT NULL,
    month_name VARCHAR(16) NOT NULL,
    quarter INT NOT NULL,
    year INT NOT NULL,
    is_weekend BOOLEAN NOT NULL
);

-- -----------------------------------------------------------------------------
-- 2. FACT TABLES
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fact_tasks (
    task_key SERIAL PRIMARY KEY,
    task_id VARCHAR(64) UNIQUE NOT NULL,
    task_code VARCHAR(32) NOT NULL,
    org_id VARCHAR(64) NOT NULL,
    dept_id VARCHAR(64),
    assigned_emp_id VARCHAR(64),
    created_date_key INT REFERENCES dim_date(date_key),
    due_date_key INT,
    completed_date_key INT,
    priority VARCHAR(16) NOT NULL,
    status VARCHAR(24) NOT NULL,
    estimated_hours NUMERIC(6,2),
    actual_hours NUMERIC(6,2),
    sla_hours NUMERIC(6,2),
    is_sla_breached BOOLEAN DEFAULT FALSE,
    is_overdue BOOLEAN DEFAULT FALSE,
    cycle_time_hours NUMERIC(6,2),
    variance_hours NUMERIC(6,2)
);

CREATE TABLE IF NOT EXISTS fact_incidents (
    incident_key SERIAL PRIMARY KEY,
    incident_id VARCHAR(64) UNIQUE NOT NULL,
    incident_code VARCHAR(32) NOT NULL,
    org_id VARCHAR(64) NOT NULL,
    dept_id VARCHAR(64),
    assigned_emp_id VARCHAR(64),
    created_date_key INT REFERENCES dim_date(date_key),
    resolved_date_key INT,
    severity VARCHAR(16) NOT NULL,
    status VARCHAR(24) NOT NULL,
    sla_hours NUMERIC(6,2),
    is_sla_breached BOOLEAN DEFAULT FALSE,
    resolution_time_hours NUMERIC(6,2),
    sla_variance_hours NUMERIC(6,2)
);

CREATE TABLE IF NOT EXISTS fact_employee_daily_workload (
    workload_key SERIAL PRIMARY KEY,
    date_key INT REFERENCES dim_date(date_key),
    org_id VARCHAR(64) NOT NULL,
    emp_id VARCHAR(64) NOT NULL,
    dept_id VARCHAR(64),
    active_tasks_count INT DEFAULT 0,
    completed_tasks_count INT DEFAULT 0,
    open_incidents_count INT DEFAULT 0,
    workload_score NUMERIC(6,2) DEFAULT 0,
    sla_compliance_rate NUMERIC(5,2) DEFAULT 100.00
);
