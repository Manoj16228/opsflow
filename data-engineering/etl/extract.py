import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

class Extractor:
    def __init__(self, db_url: str = None):
        self.db_url = db_url or os.getenv(
            "DATABASE_URL",
            "postgresql://opsflow_admin:opsflow_secure_password_2026@localhost:5432/opsflow_db?schema=public"
        )
        self.engine = create_engine(self.db_url)

    def extract_raw_data(self):
        """Extracts operational dataframes from OLTP PostgreSQL tables."""
        print("📥 Extracting operational OLTP records from PostgreSQL...")
        
        orgs_df = pd.read_sql("SELECT id, name, slug, industry, plan FROM organizations", self.engine)
        depts_df = pd.read_sql("SELECT id, \"organizationId\", name, code FROM departments", self.engine)
        emps_df = pd.read_sql(
            "SELECT id, \"organizationId\", \"departmentId\", \"employeeCode\", \"firstName\", \"lastName\", email, designation, status FROM employees",
            self.engine
        )
        tasks_df = pd.read_sql(
            "SELECT id, \"taskCode\", \"organizationId\", \"departmentId\", \"assignedToId\", \"createdById\", priority, status, \"estimatedHours\", \"actualHours\", \"startDate\", \"dueDate\", \"completedDate\", \"slaHours\", \"slaDeadline\", \"isSlaBreached\", \"createdAt\" FROM tasks",
            self.engine
        )
        incidents_df = pd.read_sql(
            "SELECT id, \"incidentCode\", \"organizationId\", \"departmentId\", \"assignedEmployeeId\", severity, status, \"slaHours\", \"slaDeadline\", \"isSlaBreached\", \"resolvedAt\", \"createdAt\" FROM incidents",
            self.engine
        )

        print(f"✅ Extracted: {len(orgs_df)} Orgs, {len(depts_df)} Depts, {len(emps_df)} Emps, {len(tasks_df)} Tasks, {len(incidents_df)} Incidents.")
        return {
            "organizations": orgs_df,
            "departments": depts_df,
            "employees": emps_df,
            "tasks": tasks_df,
            "incidents": incidents_df,
        }
