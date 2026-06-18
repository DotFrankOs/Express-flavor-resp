module.exports = {
  protegerRuta: require('./auth.middleware').protegerRuta,
  opcionalAuth: require('./auth.middleware').opcionalAuth,
  errorMiddleware: require('./error.middleware'),
  requestLog: require('./request-log.middleware')
};