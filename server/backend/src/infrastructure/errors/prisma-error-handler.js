const ApplicationError = require('../../domain/errors/application-error');

class PrismaErrorHandler {
  constructor() {
    this.prismaErrors = {
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
  }

  handle(error) {
    if (error.code && this.prismaErrors[error.code]) {
      const { message, status } = this.prismaErrors[error.code];
      return { statusCode: status, message };
    }

    if (error.name === 'PrismaClientValidationError') {
      return { statusCode: 400, message: 'Error de validación en la consulta' };
    }

    if (error.name === 'PrismaClientInitializationError') {
      return { statusCode: 500, message: 'Error de conexión con la base de datos' };
    }

    if (error.name === 'PrismaClientKnownRequestError') {
      return { statusCode: 500, message: 'Error en la operación de base de datos' };
    }

    return null; // No pudo manejarlo
  }
}

module.exports = PrismaErrorHandler;