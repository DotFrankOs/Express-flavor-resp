const prisma = require('../lib/prisma');

function safeJson(val) {
  if (!val) return null;
  return typeof val === 'string' ? val : JSON.stringify(val);
}

function parseJson(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

exports.getCart = async (req, res) => {
  try {
    const rows = await prisma.cartItem.findMany({ where: { user_id: req.params.userId } });
    const items = rows.map(r => ({
      id: r.id, name: r.name, baseName: r.base_name,
      price: parseFloat(r.price), basePrice: parseFloat(r.base_price),
      restaurantId: r.restaurant_id, restaurantName: r.restaurant_name,
      quantity: r.quantity,
      variant: parseJson(r.variant),
      options: parseJson(r.options) || [],
      image: r.image
    }));
    res.json({ items, updatedAt: items.length > 0 ? new Date().toISOString() : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveCart = async (req, res) => {
  try {
    if (req.params.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });
    const { items } = req.body;
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { user_id: req.params.userId } });
      for (const item of items) {
        await tx.cartItem.create({
          data: {
            id: item.id, user_id: req.params.userId,
            name: item.name, base_name: item.baseName || item.name,
            price: item.price, base_price: item.basePrice || item.price,
            restaurant_id: item.restaurantId, restaurant_name: item.restaurantName,
            quantity: item.quantity,
            variant: safeJson(item.variant),
            options: safeJson(item.options),
            image: item.image || null
          }
        });
      }
    });
    res.json({ items, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    if (req.params.userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });
    await prisma.cartItem.deleteMany({ where: { user_id: req.params.userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
