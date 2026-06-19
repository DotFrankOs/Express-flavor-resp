const { orderService } = require('../services');
const { OrderDTO } = require('../dto');

exports.create = async (req, res, next) => {
  try {
    if (req.body.userId !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const { order, items, now, deliveryCode } = await orderService.create(req.body, req.userId);
    res.status(201).json(OrderDTO.forCreationResponse(order, items, deliveryCode));
  } catch (err) {
    next(err);
  }
};

exports.getByUser = async (req, res, next) => {
  try {
    const data = await orderService.getByUser(req.params.userId, req.userId);
    res.json(OrderDTO.fromRawList(data));
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, statusNote } = req.body;
    const data = await orderService.updateStatus(
      req.params.id,
      status,
      statusNote,
      req.userId,
      req.userRole
    );
    res.json({
      id: data.id,
      status: data.status,
      statusNote: data.status_note,
      updatedAt: data.updated_at
    });
  } catch (err) {
    next(err);
  }
};