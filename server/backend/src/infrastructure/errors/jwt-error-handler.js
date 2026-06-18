class JwtErrorHandler {
  handle(error) {
    if (error.name === 'JsonWebTokenError') {
      return { statusCode: 401, message: 'Token inválido' };
    }
    if (error.name === 'TokenExpiredError') {
      return { statusCode: 401, message: 'Token expirado' };
    }
    return null;
  }
}

module.exports = JwtErrorHandler;