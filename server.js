require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const http = require('http');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { Server } = require('socket.io');
const pool = require('./config/db');
const WhatsAppService = require('./services/whatsappService');
const { ensureSchema } = require('./config/ensureSchema');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400000 }
};

if (process.env.DATABASE_URL) {
  sessionConfig.store = new pgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true });
} else {
  console.warn('DATABASE_URL is not set. Falling back to in-memory sessions (not for production).');
}

app.use(session(sessionConfig));

const waService = new WhatsAppService(io);
app.use('/', require('./routes/index')(waService));
app.use('/admin', require('./routes/admin')(waService));

app.use((err, req, res, _next) => {
  res.status(500).render('error', { message: err.message || 'Unexpected server error' });
});

const port = process.env.PORT || 3000;

(async () => {
  try {
    await ensureSchema();
    server.listen(port, async () => {
      console.log(`Server listening on ${port}`);
      try { await waService.connect(); } catch (e) { console.error(e.message); }
    });
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    process.exit(1);
  }
})();
