const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function init() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("Connected to postgres. Creating database...");
    
    // 1. Create database if not exists
    try {
      await client.query('CREATE DATABASE f1telemetry');
    } catch (e) {
      if (e.code === '42P04') {
        console.log("Database f1telemetry already exists.");
      } else {
        throw e;
      }
    }
    await client.end();

    // 2. Connect to f1telemetry and run schema
    const f1Client = new Client({ 
      connectionString: connectionString.replace('/postgres', '/f1telemetry')
    });
    await f1Client.connect();
    
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log("Executing schema.sql...");
    await f1Client.query(schema);

    const seedsPath = path.join(__dirname, '../../database/seeds.sql');
    const seeds = fs.readFileSync(seedsPath, 'utf8');
    console.log("Executing seeds.sql...");
    await f1Client.query(seeds);

    await f1Client.end();
    console.log("Database initialized successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  }
}

init();
