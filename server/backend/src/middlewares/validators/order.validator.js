const Joi = require('joi');

const orderItemOptionSchema = Joi.object({
  choiceId: Joi.string().required(),
  choiceName: Joi.string().required(),
  priceModifier: Joi.number().min(0).default(0)
});

const orderItemSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  baseName: Joi.string().optional().allow(''),
  price: Joi.number().positive().required(),
  basePrice: Joi.number().positive().optional(),
  quantity: Joi.number().integer().min(1).required(),
  variant: Joi.object().optional().allow(null),
  options: Joi.array().optional().default([]),
  image: Joi.string().optional().allow('', null),
  restaurantId: Joi.string().optional(),
  restaurantName: Joi.string().optional()
});

const createOrderSchema = Joi.object({
  items: Joi.array().items(orderItemSchema).min(1).required(),
  total: Joi.number().positive().required(),
  restaurantId: Joi.string().required(),
  restaurantName: Joi.string().required(),
  userId: Joi.string().required(),
  paymentMethod: Joi.string().valid('card', 'cash').default('card'),
  deliveryCode: Joi.string().optional().allow('')
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'delivering', 'delivered', 'issue').required(),
  statusNote: Joi.string().optional().allow('')
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
  validateCreateOrder: validate(createOrderSchema),
  validateUpdateStatus: validate(updateStatusSchema)
};