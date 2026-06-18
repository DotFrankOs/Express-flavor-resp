const { staffService } = require('../services');
const { RestaurantDTO, UserRestaurantDTO } = require('../dto');

exports.getMyRestaurants = async (req, res, next) => {
  try {
    const data = await staffService.getMyRestaurants(req.userId);
    res.json(data.map(r => RestaurantDTO.forStaffList(r)));
  } catch (err) {
    next(err);
  }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const data = await staffService.getDashboard(req.userId, req.params.restaurantId);
    res.json(UserRestaurantDTO.forDashboard(data));
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, statusNote } = req.body;
    const data = await staffService.updateOrderStatus(req.userId, req.params.orderId, status, statusNote);
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