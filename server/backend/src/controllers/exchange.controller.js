const prisma = require('../lib/prisma');

exports.getRates = async (req, res) => {
  try {
    const rows = await prisma.exchangeRate.findMany();
    const rates = {}; const symbols = {};
    rows.forEach(r => { rates[r.code] = parseFloat(r.rate); symbols[r.code] = r.symbol; });
    res.json({ base: 'USD', rates, symbols });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
