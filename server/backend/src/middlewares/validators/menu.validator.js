const Joi = require('joi');

const choiceSchema = Joi.object({
  id: Joi.string().max(50).required(),
  name: Joi.string().max(100).required(),
  priceModifier: Joi.number().default(0)
});

const optionSchema = Joi.object({
  id: Joi.string().max(50).required(),
  name: Joi.string().max(100).required(),
  required: Joi.boolean().default(false),
  multiSelect: Joi.boolean().default(false),
  choices: Joi.array().items(choiceSchema).min(1).required()
});

const variantItemSchema = Joi.object({
  id: Joi.string().max(50).required(),
  name: Joi.string().max(100).required(),
  price: Joi.number().positive().required()
});

const variantSchema = Joi.object({
  required: Joi.boolean().default(false),
  items: Joi.array().items(variantItemSchema).min(1).required()
});

const createItemSchema = Joi.object({
  id: Joi.string().max(50).required(),
  name: Joi.string().max(100).required(),
  price: Joi.number().positive().required(),
  image: Joi.string().max(200).allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  options: Joi.array().items(optionSchema).optional(),
  variants: variantSchema.optional()
});

const updateItemSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  price: Joi.number().positive().optional(),
  image: Joi.string().max(200).allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  isActive: Joi.boolean().optional()
}).min(1);

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
  validateCreateItem: validate(createItemSchema),
  validateUpdateItem: validate(updateItemSchema)
};