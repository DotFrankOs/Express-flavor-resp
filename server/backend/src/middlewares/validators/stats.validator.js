const Joi = require('joi');

const recordPurchaseSchema = Joi.object({
  restaurantId: Joi.string().required(),
  itemId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).default(1),
  variant: Joi.object({
    variantId: Joi.string().required()
  }).optional().allow(null),
  options: Joi.array().optional().default([])
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
  validateRecordPurchase: validate(recordPurchaseSchema)
};