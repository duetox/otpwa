const express = require('express');
const settingsService = require('../services/settingsService');
const { recentLogs, addLog } = require('../services/auditService');

module.exports = (waService) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const settings = await settingsService.getAllSettings();
    const logs = await recentLogs(50);
    res.render('admin/dashboard', { settings, logs, waState: waService.state, qr: waService.qrDataUrl });
  });

  router.post('/settings', async (req, res) => {
    await settingsService.setSetting('otp_expiry_seconds', Number(req.body.otp_expiry_seconds || 300));
    await settingsService.setSetting('otp_max_attempts', Number(req.body.otp_max_attempts || 5));
    await addLog('info', 'settings_updated', req.body);
    res.redirect('/admin');
  });

  router.post('/wa/connect', async (_, res) => { await waService.connect(); res.redirect('/admin'); });
  router.post('/wa/disconnect', async (_, res) => { await waService.disconnect(); res.redirect('/admin'); });

  return router;
};
