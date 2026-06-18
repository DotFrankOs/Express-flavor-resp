const { menuService } = require('../services');
const { MenuItemDTO } = require('../dto');

exports.getMenu = async (req, res, next) => {
  try {
    const data = await menuService.getMenuByRestaurantId(req.params.id);
    res.json(MenuItemDTO.fromRawList(data));
  } catch (err) {
    next(err);
  }
};