const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_FILE = path.join(LOG_DIR, `api-${new Date().toISOString().split('T')[0]}.log`);

function log(level, message, meta = {}) {
  const ts = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  const entry = `[${ts}] [${level.toUpperCase()}] ${message} ${metaStr}`.trim();
  
  console.log(entry);
  
  try {
    fs.appendFileSync(LOG_FILE, entry + '\n');
  } catch (e) {
    console.error('Error escribiendo log:', e.message);
  }
}

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  api: (msg, meta) => log('api', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta)
};