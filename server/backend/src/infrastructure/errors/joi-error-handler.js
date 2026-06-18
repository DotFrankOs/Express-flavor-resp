class JoiErrorHandler {
  handle(error) {
    if (error.isJoi) {
      return {
        statusCode: 400,
        message: 'Datos inválidos',
        details: error.details.map(d => d.message)
      };
    }
    return null;
  }
}

module.exports = JoiErrorHandler;