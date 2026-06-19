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

exports.createItem = async (req, res, next) => {
  try {
    const item = await menuService.createItem(req.params.id, req.body);
    res.status(201).json(MenuItemDTO.fromRaw(item));
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const item = await menuService.updateItem(req.params.id, req.params.itemId, req.body);
    res.json(MenuItemDTO.fromRaw(item));
  } catch (err) {
    next(err);
  }
};

exports.toggleItem = async (req, res, next) => {
  try {
    const item = await menuService.toggleItem(req.params.id, req.params.itemId);
    res.json({ id: item.id, isActive: item.is_active, message: item.is_active ? 'Item activado' : 'Item desactivado' });
  } catch (err) {
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    await menuService.deleteItem(req.params.id, req.params.itemId);
    res.json({ success: true, message: 'Item eliminado permanentemente' });
  } catch (err) {
    next(err);
  }
};