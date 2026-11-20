-- F1 Telemetry Visualizer Pro Schema

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team VARCHAR(100),
    color VARCHAR(7), -- HEX color
    number INTEGER
);

-- Races table
CREATE TABLE IF NOT EXISTS races (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    track VARCHAR(100),
    date DATE
);

-- Telemetry table (Partitioned by race_id)
CREATE TABLE IF NOT EXISTS telemetry (
    id BIGSERIAL,
    race_id INTEGER NOT NULL REFERENCES races(id),
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id),
    session_time FLOAT NOT NULL, -- seconds from start
    timestamp TIMESTAMPTZ NOT NULL,
    speed FLOAT,
    throttle FLOAT,
    brake FLOAT,
    gear INTEGER,
    rpm INTEGER,
    drs BOOLEAN,
    x FLOAT,
    y FLOAT,
    z FLOAT,
    PRIMARY KEY (id, race_id)
) PARTITION BY LIST (race_id);

-- Leaderboard Snapshots
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    id BIGSERIAL PRIMARY KEY,
    race_id INTEGER NOT NULL REFERENCES races(id),
    session_time FLOAT NOT NULL,
    driver_id VARCHAR(50) NOT NULL REFERENCES drivers(id),
    position INTEGER NOT NULL,
    gap_to_leader FLOAT,
    interval_to_car_ahead FLOAT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_telemetry_lookup ON telemetry (race_id, driver_id, session_time);
CREATE INDEX IF NOT EXISTS idx_leaderboard_lookup ON leaderboard_snapshots (race_id, session_time);
