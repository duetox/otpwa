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
    const message = `🔐 Your verification code is: ${otp}\n\n⏳ Expires in ${Math.floor(expirySeconds / 60)} minutes.\n⚠️ Never share this code.`;
    const jid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
    await this.sock.sendMessage(jid, { text: message });
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
