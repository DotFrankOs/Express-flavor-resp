const { orderService } = require('../services');
const { OrderDTO } = require('../dto');

exports.create = async (req, res, next) => {
  try {
    const { order, items, now } = await orderService.create(req.body, req.userId);
    res.json(OrderDTO.forCreationResponse(order, items));
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
    const data = await orderService.updateStatus(req.params.id, status, statusNote);
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