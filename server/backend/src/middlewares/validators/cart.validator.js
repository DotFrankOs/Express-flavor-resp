const Joi = require('joi');

const cartItemSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().required(),
  baseName: Joi.string().optional().allow(''),
  price: Joi.number().positive().required(),
  basePrice: Joi.number().positive().optional(),
  restaurantId: Joi.string().required(),
  restaurantName: Joi.string().required(),
  quantity: Joi.number().integer().min(1).default(1),
  variant: Joi.object().optional().allow(null),
  options: Joi.array().optional().default([]),
  image: Joi.string().optional().allow('', null)
});

const saveCartSchema = Joi.object({
  items: Joi.array().items(cartItemSchema).required(),
  updatedAt: Joi.string().isoDate().optional().allow(null)
});

const updateQuantitySchema = Joi.object({
  quantity: Joi.number().integer().min(1).required()
});

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.details.map(d => d.message) });
    }
    next();
  };
}

module.exports = {
  validateSaveCart: validate(saveCartSchema),
  validateCartItem: validate(cartItemSchema),
  validateUpdateQuantity: validate(updateQuantitySchema)
};