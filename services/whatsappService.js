const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const logger = require('../config/logger');

const authFolder = path.join(process.cwd(), 'sessions', 'baileys_auth');
if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });

class WhatsAppService {
  constructor(io) {
    this.io = io;
    this.sock = null;
    this.state = 'Disconnected';
    this.qrDataUrl = null;
    this.lastSentByNumber = new Map();
  }

  emit() {
    this.io.emit('wa:status', { state: this.state, qrDataUrl: this.qrDataUrl });
  }

  async connect() {
    this.state = 'Connecting'; this.emit();
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({ version, auth: state, printQRInTerminal: false });
    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        this.state = 'QR Generated';
        this.qrDataUrl = await QRCode.toDataURL(qr);
      }
      if (connection === 'open') {
        this.state = 'Connected Successfully';
        this.qrDataUrl = null;
      }
      if (connection === 'close') {
        this.state = 'Disconnected';
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code !== DisconnectReason.loggedOut) {
          this.state = 'Reconnecting';
          setTimeout(() => this.connect(), 3000);
        }
      }
      this.emit();
    });
  }

  async sendOtp(phone, otp, expirySeconds) {
    if (!this.sock) throw new Error('WhatsApp is not connected');
    const normalizedPhone = String(phone || '').replace(/\D/g, '');
    if (!normalizedPhone) throw new Error('Invalid phone number');

    const jid = `${normalizedPhone}@s.whatsapp.net`;
    const [isRegistered] = await this.sock.onWhatsApp(normalizedPhone);
    if (!isRegistered?.exists) {
      throw new Error('WhatsApp number is not registered');
    }

    const message = `🌸 *Your OTP is: ${otp}*\n\n⏳ Expires in ${Math.max(1, Math.floor(expirySeconds / 60))} minutes.\n⚠️ Never share this code with anyone.`;

    await this.sock.presenceSubscribe(jid);
    await new Promise((resolve) => setTimeout(resolve, 250));

    await this.sock.sendMessage(jid, { text: message });
    this.lastSentByNumber.set(normalizedPhone, {
      phone: normalizedPhone,
      message,
      sentAt: new Date().toISOString()
    });
  }

  getLastSentToNumber(phone) {
    const normalizedPhone = String(phone || '').replace(/\D/g, '');
    return this.lastSentByNumber.get(normalizedPhone) || null;
  }

  async disconnect() {
    if (this.sock) {
      await this.sock.logout();
      this.sock.end();
      this.sock = null;
    }
    this.state = 'Disconnected';
    this.emit();
  }
}

module.exports = WhatsAppService;
