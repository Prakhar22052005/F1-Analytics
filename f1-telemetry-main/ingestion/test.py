from sqlalchemy import create_engine, text
import os
engine = create_engine("sqlite:///../f1telemetry.sqlite")
with engine.connect() as conn:
    print("Tables:", conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall())
