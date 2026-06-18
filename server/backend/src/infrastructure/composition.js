const createErrorMiddleware = require('../middlewares/error.middleware');
const CompositeErrorHandler = require('./errors/composite-error-handler');
const PrismaErrorHandler = require('./errors/prisma-error-handler');
const JwtErrorHandler = require('./errors/jwt-error-handler');
const JoiErrorHandler = require('./errors/joi-error-handler');

const errorHandler = new CompositeErrorHandler([
  new PrismaErrorHandler(),
  new JwtErrorHandler(),
  new JoiErrorHandler()
]);

const errorMiddleware = createErrorMiddleware(errorHandler);

module.exports = {
  errorMiddleware
};