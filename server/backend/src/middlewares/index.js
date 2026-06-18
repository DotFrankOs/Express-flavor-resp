module.exports = {
  protegerRuta: require('./auth.middleware').protegerRuta,
  opcionalAuth: require('./auth.middleware').opcionalAuth,
  requireRoles: require('./auth.middleware').requireRoles,
  requireStaff: require('./auth.middleware').requireStaff,
  requireAdmin: require('./auth.middleware').requireAdmin,
  errorMiddleware: require('./error.middleware'),
  requestLog: require('./request-log.middleware')
};