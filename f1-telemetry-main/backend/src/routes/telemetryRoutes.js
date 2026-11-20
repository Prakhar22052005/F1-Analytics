const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /telemetry/:raceId/track - Get normalized track coordinates (average of all drivers)
// This is used by the frontend to generate the spline
router.get('/:raceId/track', async (req, res) => {
    const { raceId } = req.params;
    try {
        // We pick the fastest lap of the leader (or just one driver) to get the track path
        const { rows } = await db.query(`
            SELECT x, y, z
            FROM telemetry
            WHERE race_id = $1 AND driver_id = 'VER'
            ORDER BY session_time ASC
            LIMIT 1000
        `, [raceId]);
        
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /telemetry/:raceId/weather - Get historical weather arrays
router.get('/:raceId/weather', async (req, res) => {
    const { raceId } = req.params;
    try {
        const { rows } = await db.query(`
            SELECT session_time, air_temp, track_temp, rainfall, wind_speed, humidity
            FROM weather
            WHERE race_id = $1
            ORDER BY session_time ASC
        `, [raceId]);
        
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// GET /telemetry/:raceId/:driverId - Get telemetry for a specific driver
router.get('/:raceId/:driverId', async (req, res) => {
    const { raceId, driverId } = req.params;
    const { start = 0, end = 3600, limit = 1000 } = req.query;

    try {
        const { rows } = await db.query(`
            SELECT session_time, x, y, z, speed, throttle, brake, gear, rpm, drs
            FROM telemetry
            WHERE race_id = $1 AND driver_id = $2
            AND session_time >= $3 AND session_time <= $4
            ORDER BY session_time ASC
            LIMIT $5
        `, [raceId, driverId, start, end, limit]);
        
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
