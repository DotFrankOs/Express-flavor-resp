const { handlePrismaError, AppError } = require('../utils/prisma-error-handler.utils');

const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  const prismaError = handlePrismaError(err);
  if (prismaError.statusCode) {
    return res.status(prismaError.statusCode).json({
      error: prismaError.message
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado' });
  }

  if (err.isJoi) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: err.details.map(d => d.message)
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON malformado en el body' });
  }

  const isDev = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: isDev ? err.message : 'Error interno del servidor',
    ...(isDev && { stack: err.stack })
  });
};

module.exports = errorMiddleware;