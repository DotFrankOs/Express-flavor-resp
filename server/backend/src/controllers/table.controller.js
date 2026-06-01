const prisma = require('../lib/prisma');

exports.getTables = async (req, res) => {
  try {
    const rows = await prisma.table.findMany({
      where: { restaurant_id: req.params.id },
      orderBy: { id: 'asc' }
    });
    res.json(rows.map(t => ({ id: t.id, name: t.name, label: t.label, style: t.style })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLayout = async (req, res) => {
  try {
    const l = await prisma.tableLayout.findUnique({ where: { restaurant_id: req.params.id } });
    if (!l) return res.json({ columns: 5, gap: '10px' });
    res.json({ columns: l.columns, gap: l.gap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
