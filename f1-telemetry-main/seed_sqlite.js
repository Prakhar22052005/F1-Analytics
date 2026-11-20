const Database = require('better-sqlite3');
const path = require('path');

const dbPath = 'c:\\Users\\nihal\\OneDrive\\Desktop\\f1-telemetry\\f1telemetry.sqlite';
const db = new Database(dbPath);

console.log("Seeding SQLite with Verification Data...");

// Insert a race
const raceStmt = db.prepare('INSERT INTO races (year, name, track, date) VALUES (?, ?, ?, ?)');
const raceInfo = raceStmt.run(2023, 'Monaco Grand Prix', 'Monaco', '2023-05-28');
const raceId = raceInfo.lastInsertRowid;

console.log(`Created Race ID: ${raceId}`);

// Insert Drivers
const drivers = [
  { id: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing', color: '#3671C6' },
  { id: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', color: '#E80020' }
];

const drvStmt = db.prepare('INSERT OR IGNORE INTO drivers (id, name, team, color) VALUES (?, ?, ?, ?)');
drivers.forEach(d => drvStmt.run(d.id, d.name, d.team, d.color));

// Insert Track & Telemetry (Simplified loop)
const telStmt = db.prepare('INSERT INTO telemetry (race_id, driver_id, session_time, x, y, z, speed, gear, throttle, brake) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

for (let s = 0; s < 100; s++) {
  const angle = s * 0.1;
  const radius = 1000000; // mm
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);
  
  telStmt.run(raceId, 'VER', s, x, y, 0, 200, 5, 100, 0);
  telStmt.run(raceId, 'LEC', s, x + 5000, y + 5000, 0, 195, 5, 95, 0);
}

console.log("Successfully seeded 200 telemetry points.");
db.close();
