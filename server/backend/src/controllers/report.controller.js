const prisma = require('../lib/prisma');

exports.getAll = async (req, res) => {
  try {
    const rows = await prisma.report.findMany({ orderBy: { date: 'desc' } });
    res.json(rows.map(r => ({
      id: r.id, description: r.description,
      image: r.image, date: r.date, userId: r.user_id
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { description, image, userId } = req.body;
    if (userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });
    const id = BigInt(Date.now());
    const date = new Date();
    const report = await prisma.report.create({
      data: { id, description, image, date, user_id: userId }
    });
    res.json({ id: report.id, description: report.description, image: report.image, date: report.date, userId: report.user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
