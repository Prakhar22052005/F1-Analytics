import fastf1
import pandas as pd
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import json
from datetime import datetime

load_dotenv()

# Database Config - Switching to SQLite
DB_URL = "sqlite:///../f1telemetry.sqlite"
engine = create_engine(DB_URL)



SCHEMA = """
CREATE TABLE IF NOT EXISTS races (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER,
    name TEXT,
    track TEXT,
    date TEXT
);
CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    name TEXT,
    team TEXT,
    color TEXT,
    number INTEGER
);
CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER,
    driver_id TEXT,
    session_time REAL,
    timestamp TEXT,
    speed INTEGER,
    throttle INTEGER,
    brake INTEGER,
    gear INTEGER,
    rpm INTEGER,
    drs BOOLEAN,
    x REAL,
    y REAL,
    z REAL,
    FOREIGN KEY(race_id) REFERENCES races(id),
    FOREIGN KEY(driver_id) REFERENCES drivers(id)
);
CREATE TABLE IF NOT EXISTS weather (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER,
    session_time REAL,
    air_temp REAL,
    track_temp REAL,
    humidity REAL,
    wind_speed REAL,
    rainfall BOOLEAN,
    FOREIGN KEY(race_id) REFERENCES races(id)
);
CREATE TABLE IF NOT EXISTS laps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id INTEGER,
    driver_id TEXT,
    lap_number INTEGER,
    lap_time REAL,
    sector1 REAL,
    sector2 REAL,
    sector3 REAL,
    compound TEXT,
    tyre_life INTEGER,
    FOREIGN KEY(race_id) REFERENCES races(id),
    FOREIGN KEY(driver_id) REFERENCES drivers(id)
);
"""

# Initialize schema
with engine.connect() as conn:
    for statement in SCHEMA.split(';'):
        if statement.strip():
            conn.execute(text(statement))
    conn.commit()

CURATED_RACES = [
    'Monaco',
    'Silverstone',
    'Spa-Francorchamps',
    'Monza',
    'Interlagos',
    'Zandvoort'
]

YEARS = [2019, 2020, 2021, 2022, 2023, 2024]

def ingest_race(year, location, session_type='R'):
    print(f"\n--- Starting SQLite Ingestion: {year} {location} {session_type} ---")
    
    if not os.path.exists('cache'):
        os.makedirs('cache')
    fastf1.Cache.enable_cache('cache')
    
    try:
        session = fastf1.get_session(year, location, session_type)
        session.load()
    except Exception as e:
        print(f"Error loading session {year} {location}: {e}")
        return

    # Check if race already exists
    with engine.connect() as conn:
        res = conn.execute(
            text("SELECT id FROM races WHERE year = :year AND name = :name"),
            {"year": year, "name": str(session.event['EventName'])}
        )
        existing = res.fetchone()
        if existing:
            print(f"Race already exists (ID: {existing[0]}). Skipping...")
            return

    # 1. Ingest Race Metadata
    race_data = {
        "year": int(year),
        "name": str(session.event['EventName']),
        "track": str(session.event['Location']),
        "date": str(session.date)
    }
    
    with engine.connect() as conn:
        conn.execute(
            text("INSERT INTO races (year, name, track, date) VALUES (:year, :name, :track, :date)"),
            race_data
        )
        conn.commit()
        # Fetch last inserted ID (SQLite style)
        res = conn.execute(text("SELECT last_insert_rowid()"))
        race_id = res.fetchone()[0]
    
    print(f"Race ingested with ID: {race_id}")

    # 2. Ingest Drivers
    print("Ingesting drivers...")
    for drv in session.drivers:
        driver = session.get_driver(drv)
        with engine.connect() as conn:
            conn.execute(
                text("INSERT OR IGNORE INTO drivers (id, name, team, color, number) VALUES (:id, :name, :team, :color, :number)"),
                {"id": str(driver['Abbreviation']), "name": str(driver['FullName']), "team": str(driver['TeamName']), "color": f"#{str(driver['TeamColor'])}", "number": int(driver['DriverNumber'])}
            )
            conn.commit()
    
    # 3. Ingest Weather Data
    print("Ingesting weather data...")
    try:
        weather_df = session.weather_data
        weather_records = []
        for _, row in weather_df.iterrows():
            weather_records.append({
                "race_id": race_id,
                "session_time": float(row['Time'].total_seconds()) if pd.notna(row['Time']) else 0.0,
                "air_temp": float(row['AirTemp']) if pd.notna(row['AirTemp']) else 0.0,
                "track_temp": float(row['TrackTemp']) if pd.notna(row['TrackTemp']) else 0.0,
                "humidity": float(row['Humidity']) if pd.notna(row['Humidity']) else 0.0,
                "wind_speed": float(row['WindSpeed']) if pd.notna(row['WindSpeed']) else 0.0,
                "rainfall": bool(row['Rainfall']) if pd.notna(row['Rainfall']) else False
            })
        if weather_records:
            with engine.connect() as conn:
                for chunk in [weather_records[i:i+500] for i in range(0, len(weather_records), 500)]:
                    conn.execute(
                        text("INSERT INTO weather (race_id, session_time, air_temp, track_temp, humidity, wind_speed, rainfall) VALUES (:race_id, :session_time, :air_temp, :track_temp, :humidity, :wind_speed, :rainfall)"),
                        chunk
                    )
                    conn.commit()
    except Exception as e:
        print(f"Error ingesting weather: {e}")

    # 4. Ingest Laps
    print("Ingesting laps data...")
    try:
        laps_df = session.laps
        laps_records = []
        for _, row in laps_df.iterrows():
            drv = row['Driver']
            # Only track our main drivers
            laps_records.append({
                "race_id": race_id,
                "driver_id": str(drv),
                "lap_number": int(row['LapNumber']) if pd.notna(row['LapNumber']) else 0,
                "lap_time": float(row['LapTime'].total_seconds()) if pd.notna(row['LapTime']) else 0.0,
                "sector1": float(row['Sector1Time'].total_seconds()) if pd.notna(row['Sector1Time']) else 0.0,
                "sector2": float(row['Sector2Time'].total_seconds()) if pd.notna(row['Sector2Time']) else 0.0,
                "sector3": float(row['Sector3Time'].total_seconds()) if pd.notna(row['Sector3Time']) else 0.0,
                "compound": str(row['Compound']) if pd.notna(row['Compound']) else "UNKNOWN",
                "tyre_life": int(row['TyreLife']) if pd.notna(row['TyreLife']) else 0
            })
        if laps_records:
            with engine.connect() as conn:
                for chunk in [laps_records[i:i+500] for i in range(0, len(laps_records), 500)]:
                    conn.execute(
                        text("INSERT INTO laps (race_id, driver_id, lap_number, lap_time, sector1, sector2, sector3, compound, tyre_life) VALUES (:race_id, :driver_id, :lap_number, :lap_time, :sector1, :sector2, :sector3, :compound, :tyre_life)"),
                        chunk
                    )
                    conn.commit()
    except Exception as e:
        print(f"Error ingesting laps: {e}")

    # 5. Ingest Telemetry
    for drv in session.drivers:
        driver_abbr = session.get_driver(drv)['Abbreviation']
        print(f"Processing {driver_abbr}...")
        
        try:
            laps = session.laps.pick_driver(drv) 
        except:
            continue
        all_telemetry = []
        
        for index, lap in laps.iterrows():
            try:
                telemetry = lap.get_telemetry()
            except:
                continue
            
            for t_idx, row in telemetry.iterrows():
                if pd.isna(row['X']) or pd.isna(row['Y']):
                    continue
                
                all_telemetry.append({
                    "race_id": race_id,
                    "driver_id": str(driver_abbr),
                    "session_time": float(row['SessionTime'].total_seconds()),
                    "timestamp": str(row['Date']),
                    "speed": int(row['Speed']),
                    "throttle": int(row['Throttle']),
                    "brake": int(row['Brake']),
                    "gear": int(row['nGear']),
                    "rpm": int(row['RPM']),
                    "drs": bool(row['DRS'] > 8),
                    "x": float(row['X']),
                    "y": float(row['Y']),
                    "z": float(row['Z'])
                })
        
        if all_telemetry:
            with engine.connect() as conn:
                for chunk in [all_telemetry[i:i+500] for i in range(0, len(all_telemetry), 500)]:
                    conn.execute(
                        text("INSERT INTO telemetry (race_id, driver_id, session_time, timestamp, speed, throttle, brake, gear, rpm, drs, x, y, z) VALUES (:race_id, :driver_id, :session_time, :timestamp, :speed, :throttle, :brake, :gear, :rpm, :drs, :x, :y, :z)"),
                        chunk
                    )
                    conn.commit()
            print(f"Transferred {len(all_telemetry)} points.")

    print(f"Finished ingestion for {location} {year}.")

if __name__ == "__main__":
    print("Verification Ingestion (SQLite): Famous GP 2023-2024...")
    races_to_ingest = [
        (2023, 'Monaco'),
        (2024, 'Silverstone'),
        (2024, 'Spa-Francorchamps'),
        (2024, 'Monza'),
        (2023, 'Las Vegas'),
        (2023, 'Interlagos')
    ]
    for year, race in races_to_ingest:
        ingest_race(year, race, 'R')
    print("\n--- VERIFICATION COMPLETE ---")

