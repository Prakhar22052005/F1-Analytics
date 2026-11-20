from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "f1telemetry")
DB_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:3306/{DB_NAME}"

# We try to create the database first
root_url = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:3306"
root_engine = create_engine(root_url)
with root_engine.connect() as conn:
    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}"))
    conn.commit()

engine = create_engine(DB_URL)
Base = declarative_base()

class Race(Base):
    __tablename__ = 'races'
    id = Column(Integer, primary_key=True, autoincrement=True)
    year = Column(Integer)
    name = Column(String(255))
    track = Column(String(255))
    date = Column(DateTime)

class Driver(Base):
    __tablename__ = 'drivers'
    id = Column(String(10), primary_key=True)
    name = Column(String(255))
    team = Column(String(255))
    color = Column(String(10))
    number = Column(Integer)

class Telemetry(Base):
    __tablename__ = 'telemetry'
    id = Column(Integer, primary_key=True, autoincrement=True)
    race_id = Column(Integer, ForeignKey('races.id'))
    driver_id = Column(String(10), ForeignKey('drivers.id'))
    session_time = Column(Float)
    timestamp = Column(DateTime)
    speed = Column(Integer)
    throttle = Column(Integer)
    brake = Column(Integer)
    gear = Column(Integer)
    rpm = Column(Integer)
    drs = Column(Boolean)
    x = Column(Float)
    y = Column(Float)
    z = Column(Float)

print("Initializing MySQL Schema...")
Base.metadata.create_all(engine)
print("✅ MySQL Schema Initialized.")
