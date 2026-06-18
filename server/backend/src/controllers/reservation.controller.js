const { reservationService } = require('../services');
const { ReservationDTO } = require('../dto');

exports.getAll = async (req, res, next) => {
  try {
    const data = await reservationService.getAllByRestaurantId(req.params.id);
    res.json(ReservationDTO.fromRawList(data));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await reservationService.create(req.params.id, req.body, req.userId);
    res.status(201).json(ReservationDTO.fromRaw(data));
  } catch (err) {
    next(err);
  }
};

exports.replaceAll = async (req, res, next) => {
  try {
    await reservationService.replaceAll(req.params.id, req.body);
    res.json(req.body);
  } catch (err) {
    next(err);
  }
};

// NUEVO: Cancelar con motivo
exports.cancel = async (req, res, next) => {
  try {
    const { tableNumber, startTime, reason } = req.body;
    const result = await reservationService.cancel(
      req.params.id,
      tableNumber,
      startTime,
      req.userId,
      reason
    );
    res.json(ReservationDTO.fromRaw(result));
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { tableNumber, startTime } = req.body;
    const result = await reservationService.remove(req.params.id, tableNumber, startTime, req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getMy = async (req, res, next) => {
  try {
    const data = await reservationService.getMyReservations(req.userId);
    res.json(ReservationDTO.fromRawList(data));
  } catch (err) {
    next(err);
  }
};