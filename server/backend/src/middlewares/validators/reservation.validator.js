const Joi = require('joi');

const createReservationSchema = Joi.object({
  number: Joi.number().integer().positive().required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
  duration: Joi.number().integer().positive().optional(),
  code: Joi.string().optional().allow(''),
  userId: Joi.string().required(),
  price: Joi.number().min(0).optional()
});

const replaceAllSchema = Joi.array().items(
  Joi.object({
    number: Joi.number().integer().positive().required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
    duration: Joi.number().integer().positive().optional(),
    code: Joi.string().optional().allow(''),
    userId: Joi.string().required(),
    price: Joi.number().min(0).optional()
  })
);

const cancelReservationSchema = Joi.object({
  tableNumber: Joi.number().integer().positive().required(),
  startTime: Joi.date().iso().required(),
  reason: Joi.string().min(3).max(500).required()
});

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
  validateCancel: validate(cancelReservationSchema),
  validateRemove: validate(removeReservationSchema)
};