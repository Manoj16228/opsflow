import os
import sys
import time
from extract import Extractor
from transform import Transformer
from load import Loader

def run_pipeline():
    print("=======================================================")
    print("🚀 OpsFlow Data Engineering ETL Pipeline Initiated")
    print("=======================================================")
    start_time = time.time()

    # 1. Extract
    extractor = Extractor()
    raw_data = extractor.extract_raw_data()

    # 2. Transform
    print("\n⚙️ Transforming into Star Schema Dimensions and Fact Tables...")
    transformer = Transformer(raw_data)
    dims = transformer.transform_dimensions()
    facts = transformer.transform_facts()

    # 3. Load
    schema_path = os.path.join(os.path.dirname(__file__), "..", "models", "star_schema.sql")
    loader = Loader()
    loader.init_schema(schema_path)

    # Load Dimensions
    for dim_name, df in dims.items():
        loader.load_table(df, dim_name, if_exists="replace")

    # Load Facts
    for fact_name, df in facts.items():
        loader.load_table(df, fact_name, if_exists="replace")

    duration = round(time.time() - start_time, 2)
    print("\n=======================================================")
    print(f"🎉 OpsFlow ETL Pipeline Completed in {duration}s!")
    print("Star Schema tables are ready for Power BI / OLAP querying.")
    print("=======================================================")

if __name__ == "__main__":
    run_pipeline()
