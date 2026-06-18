const { restaurantService } = require('../services');
const { RestaurantDTO } = require('../dto');

exports.getAll = async (req, res, next) => {
  try {
    const data = await restaurantService.getAll();
    res.json(RestaurantDTO.fromRawList(data));
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await restaurantService.getById(req.params.id);
    res.json(RestaurantDTO.fromRaw(data));
  } catch (err) {
    next(err);
  }
};