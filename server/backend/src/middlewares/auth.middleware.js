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
    req.userRole = decoded.role || 'customer';
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
      req.userRole = decoded.role || 'customer';
    } catch {}
  }
  next();
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado.' });
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        error: 'No autorizado. Se requiere rol: ' + allowedRoles.join(' o ') 
      });
    }
    next();
  };
}

function requireStaff(req, res, next) {
  const staffRoles = ['staff', 'manager', 'owner', 'admin'];
  if (!req.user) return res.status(401).json({ error: 'No autenticado.' });
  if (!staffRoles.includes(req.userRole)) {
    return res.status(403).json({ error: 'Acceso restringido a personal autorizado.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado.' });
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores.' });
  }
  next();
}

module.exports = { 
  protegerRuta, opcionalAuth, requireRoles, requireStaff, requireAdmin
};