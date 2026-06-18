const Joi = require('joi');

const loginSchema = Joi.object({
  username: Joi.string().min(1).max(50).required(),
  password: Joi.string().min(1).max(100).required()
});

const registerSchema = Joi.object({
  user: Joi.string().min(1).max(50).required(),
  pass: Joi.string().min(1).max(100).required(),
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().max(100).optional().allow('')
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
  validateLogin: validate(loginSchema),
  validateRegister: validate(registerSchema)
};