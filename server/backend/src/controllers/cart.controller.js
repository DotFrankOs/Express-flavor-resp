const { cartService } = require('../services');
const { CartItemDTO } = require('../dto');

exports.getCart = async (req, res, next) => {
  try {
    const data = await cartService.getCart(req.params.userId);
    const items = CartItemDTO.fromRawList(data);
    res.json({
      items,
      updatedAt: items.length > 0 ? new Date().toISOString() : null
    });
  } catch (err) {
    next(err);
  }
};

exports.saveCart = async (req, res, next) => {
  try {
    const { items } = req.body;
    const result = await cartService.saveCart(req.params.userId, items, req.userId);
    res.json({
      items: result,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const result = await cartService.clearCart(req.params.userId, req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};