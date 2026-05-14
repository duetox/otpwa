const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const authRequired = require('../middleware/auth');
const settingsService = require('../services/settingsService');
const { recentLogs, addLog } = require('../services/auditService');

module.exports = (waService) => {
  const router = express.Router();

  router.get('/login', (req, res) => res.render('admin/login', { error: null }));

  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM admin_users WHERE username=$1', [username]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).render('admin/login', { error: 'Invalid credentials' });
    }
    req.session.adminId = user.id;
    return res.redirect('/admin');
  });

  router.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/admin/login')));

  router.get('/', authRequired, async (req, res) => {
    const settings = await settingsService.getAllSettings();
    const logs = await recentLogs(50);
    res.render('admin/dashboard', { settings, logs, waState: waService.state, qr: waService.qrDataUrl });
  });

  router.post('/settings', authRequired, async (req, res) => {
    await settingsService.setSetting('otp_expiry_seconds', Number(req.body.otp_expiry_seconds || 300));
    await settingsService.setSetting('otp_max_attempts', Number(req.body.otp_max_attempts || 5));
    await addLog('info', 'settings_updated', req.body);
    res.redirect('/admin');
  });

  router.post('/wa/connect', authRequired, async (_, res) => { await waService.connect(); res.redirect('/admin'); });
  router.post('/wa/disconnect', authRequired, async (_, res) => { await waService.disconnect(); res.redirect('/admin'); });

  router.post('/seed-admin', async (req, res) => {
    const { username = 'as', password = 'as123' } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO admin_users (id, username, password_hash) VALUES ($1,$2,$3) ON CONFLICT (username) DO NOTHING',
      [uuidv4(), username, hash]
    );
    res.json({ ok: true, message: 'Admin seeded' });
  });

  return router;
};
