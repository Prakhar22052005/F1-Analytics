const mockDb = require('./backend/src/config/mockDb');

async function test() {
  const result = await mockDb.query("SELECT x, y, z FROM telemetry WHERE race_id = $1 AND driver_id = 'VER'", ['1']);
  console.log("Track length:", result.rows.length);

  const result2 = await mockDb.query("SELECT * FROM telemetry WHERE race_id = $1 AND driver_id = $2", ['1', 'VER']);
  console.log("Driver length:", result2.rows.length);
}

test();
