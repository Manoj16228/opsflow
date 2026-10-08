import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

class Loader:
    def __init__(self, target_db_url: str = None):
        self.db_url = target_db_url or os.getenv(
            "ANALYTICS_DATABASE_URL",
            os.getenv("DATABASE_URL", "postgresql://opsflow_admin:opsflow_secure_password_2026@localhost:5432/opsflow_db?schema=public")
        )
        self.engine = create_engine(self.db_url)

    def init_schema(self, schema_file_path: str):
        """Executes DDL to guarantee star schema tables exist."""
        print(f"🔨 Ensuring Star Schema tables exist in analytics database...")
        with open(schema_file_path, "r") as f:
            ddl = f.read()
        
        with self.engine.connect() as conn:
            conn.execute(text(ddl))
            conn.commit()
        print("✅ Analytics DDL executed successfully.")

    def load_table(self, df, table_name: str, if_exists="replace"):
        """Loads transformed DataFrame into PostgreSQL analytics table."""
        print(f"📤 Loading {len(df)} rows into {table_name}...")
        df.to_sql(table_name, self.engine, if_exists=if_exists, index=False, method="multi")
        print(f"✅ Loaded {table_name}.")
