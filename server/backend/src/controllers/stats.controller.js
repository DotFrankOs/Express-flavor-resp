const prisma = require('../lib/prisma');

exports.recordPurchase = async (req, res) => {
  try {
    const { restaurantId, itemId, quantity, variant } = req.body;
    const qty = quantity || 1;
    await prisma.itemStat.upsert({
      where: { restaurant_id_item_key: { restaurant_id: restaurantId, item_key: itemId } },
      update: { count: { increment: qty } },
      create: { restaurant_id: restaurantId, item_key: itemId, count: qty }
    });
    if (variant && variant.variantId) {
      const key = `${itemId}|${variant.variantId}`;
      await prisma.itemStat.upsert({
        where: { restaurant_id_item_key: { restaurant_id: restaurantId, item_key: key } },
        update: { count: { increment: qty } },
        create: { restaurant_id: restaurantId, item_key: key, count: qty }
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const rows = await prisma.itemStat.findMany({ where: { restaurant_id: req.params.id } });
    const stats = {};
    rows.forEach(r => { stats[r.item_key] = r.count; });
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTop = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const rows = await prisma.itemStat.findMany({
      where: { restaurant_id: req.params.id, NOT: { item_key: { contains: '|' } } },
      orderBy: { count: 'desc' },
      take: limit
    });
    res.json(rows.map(r => ({ itemId: r.item_key, count: r.count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getItemCount = async (req, res) => {
  try {
    const rows = await prisma.itemStat.findMany({
      where: {
        restaurant_id: req.params.id,
        OR: [
          { item_key: req.params.itemId },
          { item_key: { startsWith: `${req.params.itemId}|` } }
        ]
      }
    });
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    res.json({ count: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVariants = async (req, res) => {
  try {
    const rows = await prisma.itemStat.findMany({
      where: { restaurant_id: req.params.id, item_key: { startsWith: `${req.params.itemId}|` } }
    });
    res.json(rows.map(r => ({
      variantId: r.item_key.split('|')[1], count: r.count
    })).sort((a, b) => b.count - a.count));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
