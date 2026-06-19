const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
require('dotenv').config();

const config = require('./config');
const logger = require('./config/logger');
const routes = require('./routes');
const { errorMiddleware } = require('./infrastructure/composition');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.use(require('./middlewares/request-log.middleware'));

app.use('/api', routes);

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

app.use(errorMiddleware);

process.on('uncaughtException', (err) => {
  logger.error('Excepción no capturada:', { message: err.message, stack: err.stack });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rechazo no manejado:', { reason: reason?.message || reason });
});

// Iniciar server
const PORT = config.port;
const HOST = config.host;

app.listen(PORT, HOST, () => {
  logger.info('=== SERVIDOR INICIADO ===');
  logger.info(`Modo: ${config.env}`);
  logger.info(`Escuchando en: http://${HOST}:${PORT}`);
  logger.info(`API: http://${HOST}:${PORT}/api`);

  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach((iface) => {
    interfaces[iface].forEach((details) => {
      if (details.family === 'IPv4' && !details.internal) {
        logger.info(`LAN: http://${details.address}:${PORT}`);
      }
    });
  });

  logger.info('=========================');
});