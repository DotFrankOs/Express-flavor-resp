const jwt = require('jsonwebtoken');
const config = require('../config');

const { secret } = config.jwt;

function protegerRuta(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado. Token Bearer requerido.' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    req.userId = decoded.user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
}

function opcionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      req.userId = decoded.user;
    } catch {
      // Token inválido, continuar sin usuario
    }
  }
  next();
}

module.exports = { protegerRuta, opcionalAuth };