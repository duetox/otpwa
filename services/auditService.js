const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

async function addLog(level, action, details = {}) {
  await pool.query('INSERT INTO audit_logs (id, level, action, details) VALUES ($1,$2,$3,$4)', [uuidv4(), level, action, details]);
}

async function recentLogs(limit = 100) {
  const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1', [limit]);
  return rows;
}

module.exports = { addLog, recentLogs };
