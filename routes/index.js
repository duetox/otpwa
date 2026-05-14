const express = require('express');
const { otpLimiter } = require('../middleware/rateLimit');
const settingsService = require('../services/settingsService');
const otpService = require('../services/otpService');
const { addLog } = require('../services/auditService');

module.exports = (waService) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    const settings = await settingsService.getAllSettings();
    res.render('index', { settings });
  });

  router.post('/send-otp', otpLimiter, async (req, res) => {
    try {
      const phone = String(req.body.phone || '').trim();
      if (!/^\+?[1-9]\d{7,14}$/.test(phone)) return res.status(400).json({ ok: false, message: 'Invalid phone number format.' });
      const settings = await settingsService.getAllSettings();
      const { code } = await otpService.createOtp(phone, Number(settings.otp_max_attempts), Number(settings.otp_expiry_seconds));
      await waService.sendOtp(phone, code, Number(settings.otp_expiry_seconds));
      await addLog('info', 'otp_sent', { phone });
      res.json({ ok: true, message: 'OTP sent successfully.' });
    } catch (error) {
      await addLog('error', 'otp_send_failed', { error: error.message });
      res.status(500).json({ ok: false, message: error.message });
    }
  });

  router.post('/verify-otp', otpLimiter, async (req, res) => {
    const { phone, otp } = req.body;
    const result = await otpService.verifyOtp(String(phone || ''), String(otp || ''));
    await addLog('info', result.ok ? 'otp_verified' : 'otp_verify_failed', { phone, reason: result.reason });
    res.json(result.ok ? { ok: true, message: 'Verification successful.' } : { ok: false, message: result.reason });
  });

  return router;
};
