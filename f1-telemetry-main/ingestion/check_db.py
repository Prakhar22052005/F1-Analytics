import sqlalchemy
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/f1telemetry")
print(f"Connecting to {DB_URL}...")

try:
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("✅ Connection successful!")
        # Check if tables exist
        res = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        tables = [row[0] for row in res]
        print(f"Found tables: {tables}")
except Exception as e:
    print(f"❌ Connection failed: {e}")
