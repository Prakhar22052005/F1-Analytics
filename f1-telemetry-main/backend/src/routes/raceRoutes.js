const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /races - List all available races
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM races ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /races/:id - Get race metadata
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM races WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Race not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /races/:id/drivers - List drivers in a race
router.get('/:id/drivers', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT d.* 
      FROM drivers d
      JOIN telemetry t ON d.id = t.driver_id
      WHERE t.race_id = $1
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /races/:id/laps - Get laps data for a race
router.get('/:id/laps', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT *
      FROM laps
      WHERE race_id = $1
      ORDER BY lap_number ASC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
