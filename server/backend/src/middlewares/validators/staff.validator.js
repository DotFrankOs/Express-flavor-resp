const Joi = require('joi');

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'delivering', 'delivered', 'issue').required(),
  statusNote: Joi.string().optional().allow('', null)
});

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
}

module.exports = {
  validateUpdateOrderStatus: validate(updateOrderStatusSchema)
};