const { statsService } = require('../services');
const { ItemStatDTO } = require('../dto');

exports.recordPurchase = async (req, res, next) => {
  try {
    const { restaurantId, itemId, quantity, variant } = req.body;
    const result = await statsService.recordPurchase(restaurantId, itemId, quantity, variant);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const data = await statsService.getStats(req.params.id);
    const stats = {};
    data.forEach(r => { stats[r.item_key] = r.count; });
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

exports.getTop = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const data = await statsService.getTop(req.params.id, limit);
    res.json(ItemStatDTO.forTopItems(data));
  } catch (err) {
    next(err);
  }
};

exports.getItemCount = async (req, res, next) => {
  try {
    const data = await statsService.getItemCount(req.params.id, req.params.itemId);
    const total = data.reduce((sum, r) => sum + r.count, 0);
    res.json({ count: total });
  } catch (err) {
    next(err);
  }
};

exports.getVariants = async (req, res, next) => {
  try {
    const data = await statsService.getVariants(req.params.id, req.params.itemId);
    res.json(ItemStatDTO.forVariants(data));
  } catch (err) {
    next(err);
  }
};