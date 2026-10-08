import pandas as pd
from datetime import datetime, timedelta

class Transformer:
    def __init__(self, raw_data: dict):
        self.raw = raw_data

    def build_dim_date(self, start_date_str="2025-01-01", days=730):
        """Generates canonical Date Dimension table."""
        start = datetime.strptime(start_date_str, "%Y-%m-%d")
        date_list = [start + timedelta(days=x) for x in range(days)]
        
        records = []
        for d in date_list:
            records.append({
                "date_key": int(d.strftime("%Y%m%d")),
                "full_date": d.date(),
                "day_of_week": d.weekday() + 1,
                "day_name": d.strftime("%A"),
                "day_of_month": d.day,
                "month_number": d.month,
                "month_name": d.strftime("%B"),
                "quarter": (d.month - 1) // 3 + 1,
                "year": d.year,
                "is_weekend": d.weekday() >= 5
            })
        return pd.DataFrame(records)

    def transform_dimensions(self):
        """Transforms raw tables into clean dimensions."""
        # dim_organization
        org_df = self.raw["organizations"].copy()
        dim_org = pd.DataFrame({
            "org_id": org_df["id"],
            "org_name": org_df["name"],
            "org_slug": org_df["slug"],
            "industry": org_df["industry"],
            "plan_tier": org_df["plan"]
        })

        # dim_department
        dept_df = self.raw["departments"].copy()
        dim_dept = pd.DataFrame({
            "dept_id": dept_df["id"],
            "org_id": dept_df["organizationId"],
            "dept_name": dept_df["name"],
            "dept_code": dept_df["code"]
        })

        # dim_employee
        emp_df = self.raw["employees"].copy()
        dim_emp = pd.DataFrame({
            "emp_id": emp_df["id"],
            "org_id": emp_df["organizationId"],
            "dept_id": emp_df["departmentId"],
            "employee_code": emp_df["employeeCode"],
            "full_name": emp_df["firstName"] + " " + emp_df["lastName"],
            "email": emp_df["email"],
            "designation": emp_df["designation"],
            "status": emp_df["status"]
        })

        dim_date = self.build_dim_date()

        return {
            "dim_organization": dim_org,
            "dim_department": dim_dept,
            "dim_employee": dim_emp,
            "dim_date": dim_date
        }

    def transform_facts(self):
        """Builds analytical Fact Tables with KPI rollups."""
        tasks_df = self.raw["tasks"].copy()
        incidents_df = self.raw["incidents"].copy()

        # 1. fact_tasks
        def to_date_key(val):
            if pd.isna(val) or val is None:
                return None
            return int(pd.to_datetime(val).strftime("%Y%m%d"))

        tasks_df["created_date_key"] = tasks_df["createdAt"].apply(to_date_key)
        tasks_df["due_date_key"] = tasks_df["dueDate"].apply(to_date_key)
        tasks_df["completed_date_key"] = tasks_df["completedDate"].apply(to_date_key)
        
        # Cycle time in hours
        tasks_df["cycle_time_hours"] = (
            pd.to_datetime(tasks_df["completedDate"]) - pd.to_datetime(tasks_df["createdAt"])
        ).dt.total_seconds() / 3600.0

        # Variance hours (actual - estimated)
        tasks_df["variance_hours"] = tasks_df["actualHours"] - tasks_df["estimatedHours"]
        tasks_df["is_overdue"] = (
            (pd.to_datetime(tasks_df["dueDate"]) < datetime.now()) & 
            (~tasks_df["status"].isin(["COMPLETED", "CANCELLED"]))
        )

        fact_tasks = pd.DataFrame({
            "task_id": tasks_df["id"],
            "task_code": tasks_df["taskCode"],
            "org_id": tasks_df["organizationId"],
            "dept_id": tasks_df["departmentId"],
            "assigned_emp_id": tasks_df["assignedToId"],
            "created_date_key": tasks_df["created_date_key"],
            "due_date_key": tasks_df["due_date_key"],
            "completed_date_key": tasks_df["completed_date_key"],
            "priority": tasks_df["priority"],
            "status": tasks_df["status"],
            "estimated_hours": tasks_df["estimatedHours"],
            "actual_hours": tasks_df["actualHours"],
            "sla_hours": tasks_df["slaHours"],
            "is_sla_breached": tasks_df["isSlaBreached"],
            "is_overdue": tasks_df["is_overdue"],
            "cycle_time_hours": tasks_df["cycle_time_hours"].round(2),
            "variance_hours": tasks_df["variance_hours"].round(2)
        })

        # 2. fact_incidents
        incidents_df["created_date_key"] = incidents_df["createdAt"].apply(to_date_key)
        incidents_df["resolved_date_key"] = incidents_df["resolvedAt"].apply(to_date_key)
        
        incidents_df["resolution_time_hours"] = (
            pd.to_datetime(incidents_df["resolvedAt"]) - pd.to_datetime(incidents_df["createdAt"])
        ).dt.total_seconds() / 3600.0
        
        incidents_df["sla_variance_hours"] = (
            incidents_df["resolution_time_hours"] - incidents_df["slaHours"]
        )

        fact_incidents = pd.DataFrame({
            "incident_id": incidents_df["id"],
            "incident_code": incidents_df["incidentCode"],
            "org_id": incidents_df["organizationId"],
            "dept_id": incidents_df["departmentId"],
            "assigned_emp_id": incidents_df["assignedEmployeeId"],
            "created_date_key": incidents_df["created_date_key"],
            "resolved_date_key": incidents_df["resolved_date_key"],
            "severity": incidents_df["severity"],
            "status": incidents_df["status"],
            "sla_hours": incidents_df["slaHours"],
            "is_sla_breached": incidents_df["isSlaBreached"],
            "resolution_time_hours": incidents_df["resolution_time_hours"].round(2),
            "sla_variance_hours": incidents_df["sla_variance_hours"].round(2)
        })

        return {
            "fact_tasks": fact_tasks,
            "fact_incidents": fact_incidents
        }
