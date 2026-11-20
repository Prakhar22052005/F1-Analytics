-- Seed Data for F1 Telemetry Visualizer Pro

-- 1. Insert Monaco GP 2023
INSERT INTO races (id, year, name, track, date) 
VALUES (1, 2023, 'Monaco Grand Prix', 'Monaco', '2023-05-28');

-- 2. Insert Drivers
INSERT INTO drivers (id, name, team, color, number) 
VALUES ('VER', 'Max Verstappen', 'Red Bull Racing', '#3671C6', 1),
       ('LEC', 'Charles Leclerc', 'Ferrari', '#E80020', 16),
       ('SAI', 'Carlos Sainz', 'Ferrari', '#E80020', 55);

-- 3. Create Partition
CREATE TABLE IF NOT EXISTS telemetry_race_1 PARTITION OF telemetry FOR VALUES IN (1);

-- 4. Generate Telemetry (Verstappen - One Lap Mockup)
-- x, y, z are in meters. Monaco is ~3.3km.
INSERT INTO telemetry (race_id, driver_id, session_time, timestamp, speed, throttle, brake, x, y, z)
SELECT 
    1, 'VER', s, NOW() + (s * interval '1 second'),
    150 + 50 * sin(s/10), -- variable speed
    70 + 30 * cos(s/5), -- variable throttle
    CASE WHEN s % 20 < 5 THEN 100 else 0 END, -- breaking chunks
    1000 * cos(s/50), -- Circular approximation of track
    1000 * sin(s/50),
    0
FROM generate_series(0, 600, 1) s;

-- 5. Generate Telemetry (Leclerc - One Lap Mockup)
INSERT INTO telemetry (race_id, driver_id, session_time, timestamp, speed, throttle, brake, x, y, z)
SELECT 
    1, 'LEC', s, NOW() + (s * interval '1 second'),
    140 + 40 * sin(s/11), 
    60 + 40 * cos(s/6), 
    CASE WHEN s % 22 < 6 THEN 100 else 0 END,
    1100 * cos(s/55), -- Different racing line
    1100 * sin(s/55),
    0
FROM generate_series(0, 600, 1) s;
