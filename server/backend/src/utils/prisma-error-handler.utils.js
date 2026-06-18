class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function handlePrismaError(error) {
  const prismaErrors = {
    'P2000': { message: 'Valor demasiado largo para la columna', status: 400 },
    'P2001': { message: 'Registro no encontrado en la condición', status: 404 },
    'P2002': { message: 'Conflicto de datos únicos', status: 409 },
    'P2003': { message: 'Violación de restricción de clave foránea', status: 400 },
    'P2004': { message: 'Falló una restricción en la base de datos', status: 400 },
    'P2005': { message: 'Valor no válido para el campo', status: 400 },
    'P2006': { message: 'Valor proporcionado no válido', status: 400 },
    'P2011': { message: 'Violación de restricción nula', status: 400 },
    'P2014': { message: 'Violación de relación requerida', status: 400 },
    'P2016': { message: 'Error de validación de consulta', status: 400 },
    'P2021': { message: 'Tabla no encontrada', status: 500 },
    'P2022': { message: 'Columna no encontrada', status: 500 },
    'P2023': { message: 'Datos inconsistentes en la base de datos', status: 500 },
    'P2025': { message: 'Recurso no encontrado', status: 404 },
    'P2026': { message: 'El motor de base de datos no soporta esta operación', status: 500 },
    'P2033': { message: 'Número demasiado grande para el tipo de dato', status: 400 }
  };

  if (error.code && prismaErrors[error.code]) {
    const { message, status } = prismaErrors[error.code];
    return new AppError(message, status);
  }

  if (error.name === 'PrismaClientValidationError') {
    return new AppError('Error de validación en la consulta', 400);
  }

  if (error.name === 'PrismaClientInitializationError') {
    return new AppError('Error de conexión con la base de datos', 500);
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    return new AppError('Error en la operación de base de datos', 500);
  }

  return error;
}

module.exports = { AppError, handlePrismaError };