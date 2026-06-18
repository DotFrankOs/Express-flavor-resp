function createErrorMiddleware(errorHandler) {
  return (err, req, res, next) => {
    console.error('Error:', err);

    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: err.message
      });
    }

    const handled = errorHandler.handle(err);
    if (handled) {
      const payload = { error: handled.message };
      if (handled.details) {
        payload.details = handled.details;
      }
      return res.status(handled.statusCode).json(payload);
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
}

module.exports = createErrorMiddleware;