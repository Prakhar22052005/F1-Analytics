const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = 'c:\\Users\\nihal\\OneDrive\\Desktop\\f1-telemetry\\f1telemetry.sqlite';
const db = new Database(dbPath);


// Initialize Tables if they don't exist (SQLite doesn't need a separate schema tool)
db.exec(`
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
`);

module.exports = {
  query: async (text, params = []) => {
    try {
      // Convert PostgreSQL $1 style to SQLite ? if needed
      const sql = typeof text === 'string' ? text.replace(/\$\d+/g, '?') : text;
      const stmt = db.prepare(sql);
      
      if (sql.trim().toLowerCase().startsWith('select')) {
        const rows = stmt.all(params);
        return { rows };
      } else {
        const info = stmt.run(params);
        return { rows: [], insertId: info.lastInsertRowid };
      }
    } catch (err) {
      console.error("[Backend] Query error:", err.message, "SQL:", text);
      throw err;
    }
  },

  db,
};
