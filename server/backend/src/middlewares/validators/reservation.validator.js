const Joi = require('joi');

const createReservationSchema = Joi.object({
  number: Joi.number().integer().positive().required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
  duration: Joi.number().integer().positive().optional(),
  code: Joi.string().optional().allow(''),
  userId: Joi.string().required()
});

const replaceAllSchema = Joi.array().items(
  Joi.object({
    number: Joi.number().integer().positive().required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
    duration: Joi.number().integer().positive().optional(),
    code: Joi.string().optional().allow(''),
    userId: Joi.string().required()
  })
);

const removeReservationSchema = Joi.object({
  tableNumber: Joi.number().integer().positive().required(),
  startTime: Joi.date().iso().required()
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
  validateCreate: validate(createReservationSchema),
  validateReplaceAll: validate(replaceAllSchema),
  validateRemove: validate(removeReservationSchema)
};