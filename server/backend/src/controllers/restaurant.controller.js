const prisma = require('../lib/prisma');

exports.getAll = async (req, res) => {
  try {
    const rows = await prisma.restaurant.findMany();
    res.json(rows.map(r => ({
      id: r.id, name: r.name, type: r.type, logo: r.logo,
      description: r.description, url: r.url,
      minDuration: r.min_duration, maxDuration: r.max_duration
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const r = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!r) return res.status(404).json({ error: 'Restaurante no encontrado' });
    res.json({
      id: r.id, name: r.name, type: r.type, logo: r.logo,
      description: r.description, url: r.url,
      minDuration: r.min_duration, maxDuration: r.max_duration
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
