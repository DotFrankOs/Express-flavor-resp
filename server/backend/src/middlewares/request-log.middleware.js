const logger = require('../config/logger');

function requestLogMiddleware(req, res, next) {
  const start = Date.now();
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  res.on('finish', () => {
    const duration = Date.now() - start;
    let bodyLog;

    if (req.method !== 'GET' && req.body) {
      try {
        bodyLog = JSON.stringify(req.body).substring(0, 500);
      } catch {
        bodyLog = '[no serializable]';
      }
    }

    logger.api(`${req.method} ${req.originalUrl}`, {
      ip: clientIp,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'] || 'unknown',
      body: bodyLog
    });
  });

  next();
}

module.exports = requestLogMiddleware;