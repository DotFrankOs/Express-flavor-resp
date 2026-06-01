const prisma = require('../lib/prisma');

exports.getAll = async (req, res) => {
  try {
    const rows = await prisma.reservation.findMany({ where: { restaurant_id: req.params.id } });
    res.json(rows.map(r => ({
      number: r.table_number, startTime: r.start_time,
      endTime: r.end_time, duration: r.duration,
      code: r.code, userId: r.user_id
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { number, startTime, endTime, duration, code, userId } = req.body;
    if (userId !== req.userId) return res.status(403).json({ error: 'No autorizado' });

    const r = await prisma.reservation.create({
      data: {
        restaurant_id: req.params.id, table_number: number,
        start_time: new Date(startTime), end_time: new Date(endTime),
        duration, code, user_id: userId
      }
    });
    res.json({ number: r.table_number, startTime: r.start_time, endTime: r.end_time, duration: r.duration, code: r.code, userId: r.user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.replaceAll = async (req, res) => {
  try {
    const reservations = req.body;
    await prisma.$transaction(async (tx) => {
      await tx.reservation.deleteMany({ where: { restaurant_id: req.params.id } });
      for (const r of reservations) {
        await tx.reservation.create({
          data: {
            restaurant_id: req.params.id, table_number: r.number,
            start_time: new Date(r.startTime), end_time: new Date(r.endTime),
            duration: r.duration, code: r.code, user_id: r.userId
          }
        });
      }
    });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { tableNumber, startTime } = req.body;
    const check = await prisma.reservation.findFirst({
      where: { restaurant_id: req.params.id, table_number: tableNumber, start_time: new Date(startTime) }
    });
    if (!check) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (check.user_id !== req.userId) return res.status(403).json({ error: 'No autorizado' });

    await prisma.reservation.deleteMany({
      where: { restaurant_id: req.params.id, table_number: tableNumber, start_time: new Date(startTime) }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMy = async (req, res) => {
  try {
    const rows = await prisma.reservation.findMany({
      where: { user_id: req.userId },
      include: { restaurant: true },
      orderBy: { start_time: 'asc' }
    });
    res.json(rows.map(r => ({
      number: r.table_number, startTime: r.start_time,
      endTime: r.end_time, duration: r.duration, code: r.code,
      userId: r.user_id, restaurantId: r.restaurant_id,
      restaurantName: r.restaurant?.name
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
