require('dotenv').config();
const pool = require('../config/db');
const { ensureSchema } = require('../config/ensureSchema');

(async () => {
  try {
    await ensureSchema();
    console.log('DB initialized');
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
