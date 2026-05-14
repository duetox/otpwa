const pool = require('../config/db');

const defaults = {
  otp_expiry_seconds: 300,
  otp_max_attempts: 5,
  brand_name: 'OTP WA Platform'
};

async function getSetting(key) {
  const { rows } = await pool.query('SELECT value FROM app_settings WHERE key=$1', [key]);
  return rows[0]?.value;
}

async function setSetting(key, value) {
  await pool.query(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  );
}

async function getAllSettings() {
  const { rows } = await pool.query('SELECT key, value FROM app_settings');
  const map = { ...defaults };
  rows.forEach((r) => { map[r.key] = r.value; });
  return map;
}

module.exports = { getSetting, setSetting, getAllSettings, defaults };
