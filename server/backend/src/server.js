const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.use((req, res, next) => {
  console.log(`[AUDITORÍA] ${req.method} -> ${req.url}`);
  next();
});

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = path.join(LOG_DIR, `api-${new Date().toISOString().split('T')[0]}.log`);

function log(level, message, meta = {}) {
  const ts = new Date().toISOString();
  const entry = `[${ts}] [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  console.log(entry);
  try { fs.appendFileSync(LOG_FILE, entry + '\n'); } catch (e) {}
}

app.use((req, res, next) => {
  const start = Date.now();
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  res.on('finish', () => {
    const duration = Date.now() - start;
    let bodyLog;
    if (req.method !== 'GET' && req.body) {
      try { bodyLog = JSON.stringify(req.body).substring(0, 500); } catch { bodyLog = '[no serializable]'; }
    }
    log('api', `${req.method} ${req.originalUrl}`, {
      ip: clientIp, status: res.statusCode, duration: `${duration}ms`,
      userAgent: req.headers['user-agent'] || 'unknown', body: bodyLog
    });
  });
  next();
});

app.use('/api', require('./routes/auth.routes'));
app.use('/api', require('./routes/restaurant.routes'));
app.use('/api', require('./routes/menu.routes'));
app.use('/api', require('./routes/table.routes'));
app.use('/api', require('./routes/reservation.routes'));
app.use('/api', require('./routes/order.routes'));
app.use('/api', require('./routes/cart.routes'));
app.use('/api', require('./routes/stats.routes'));
app.use('/api', require('./routes/report.routes'));
app.use('/api', require('./routes/exchange.routes'));
app.use('/api', require('./routes/health.routes'));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason, promise) => console.error('Unhandled Rejection at:', promise, 'reason:', reason));

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  log('info', '=== SERVIDOR INICIADO ===');
  log('info', `Modo: ${process.env.NODE_ENV || 'development'}`);
  log('info', `Escuchando en: http://${HOST}:${PORT}`);
  log('info', `API: http://${HOST}:${PORT}/api`);
  
  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach((iface) => {
    interfaces[iface].forEach((details) => {
      if (details.family === 'IPv4' && !details.internal) {
        log('info', `LAN: http://${details.address}:${PORT}`);
      }
    });
  });
  
  log('info', '=========================');
});