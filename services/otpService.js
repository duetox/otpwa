const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createOtp(phone, maxAttempts, expirySeconds) {
  const code = generateOtp();
  const hash = await bcrypt.hash(code, 10);
  const id = uuidv4();
  await pool.query(
    `INSERT INTO otp_records (id, phone, otp_hash, expires_at, max_attempts)
     VALUES ($1,$2,$3,NOW() + ($4 || ' seconds')::interval,$5)`,
    [id, phone, hash, expirySeconds, maxAttempts]
  );
  return { id, code };
}

async function verifyOtp(phone, code) {
  const { rows } = await pool.query(
    `SELECT * FROM otp_records WHERE phone=$1 AND status='pending' ORDER BY created_at DESC LIMIT 1`,
    [phone]
  );
  const record = rows[0];
  if (!record) return { ok: false, reason: 'No active OTP found.' };
  if (new Date(record.expires_at) < new Date()) return { ok: false, reason: 'OTP expired.' };
  if (record.attempts >= record.max_attempts) return { ok: false, reason: 'Maximum attempts reached.' };

  const matches = await bcrypt.compare(code, record.otp_hash);
  if (!matches) {
    await pool.query('UPDATE otp_records SET attempts = attempts + 1 WHERE id=$1', [record.id]);
    return { ok: false, reason: 'Incorrect OTP.' };
  }

  await pool.query("UPDATE otp_records SET status='verified', verified_at=NOW() WHERE id=$1", [record.id]);
  return { ok: true };
}

module.exports = { createOtp, verifyOtp };
