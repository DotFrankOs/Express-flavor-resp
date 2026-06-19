const { cartService } = require('../services');
const { CartItemDTO } = require('../dto');

exports.getCart = async (req, res, next) => {
  try {
    if (req.params.userId !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const data = await cartService.getCart(req.params.userId);
    res.json({ items: CartItemDTO.fromRawList(data), updatedAt: data.length > 0 ? new Date().toISOString() : null });
  } catch (err) { next(err); }
};

exports.saveCart = async (req, res, next) => {
  try {
    const result = await cartService.saveCart(req.params.userId, req.body.items, req.userId);
    res.json({ items: CartItemDTO.fromRawList(result), updatedAt: new Date().toISOString() });
  } catch (err) { next(err); }
};

exports.addItem = async (req, res, next) => {
  try {
    const result = await cartService.addItem(req.params.userId, req.body, req.userId);
    res.json({ items: CartItemDTO.fromRawList(result), updatedAt: new Date().toISOString() });
  } catch (err) { next(err); }
};

exports.updateQuantity = async (req, res, next) => {
  try {
    const result = await cartService.updateQuantity(req.params.userId, req.params.itemId, req.body.quantity, req.userId);
    res.json({ items: CartItemDTO.fromRawList(result), updatedAt: new Date().toISOString() });
  } catch (err) { next(err); }
};

exports.removeItem = async (req, res, next) => {
  try {
    const result = await cartService.removeItem(req.params.userId, req.params.itemId, req.userId);
    res.json({ items: CartItemDTO.fromRawList(result), updatedAt: new Date().toISOString() });
  } catch (err) { next(err); }
};

exports.clearCart = async (req, res, next) => {
  try {
    const result = await cartService.clearCart(req.params.userId, req.userId);
    res.json(result);
  } catch (err) { next(err); }
};