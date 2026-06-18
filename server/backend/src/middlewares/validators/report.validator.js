const Joi = require('joi');

const createReportSchema = Joi.object({
  description: Joi.string().min(1).max(2000).required(),
  image: Joi.string().uri().optional().allow(''),
  userId: Joi.string().required()
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
  validateCreate: validate(createReportSchema)
};