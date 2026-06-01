const prisma = require('../lib/prisma');

exports.getMyRestaurants = async (req, res) => {
  try {
    const rows = await prisma.userRestaurant.findMany({
      where: { user_id: req.userId },
      include: { restaurant: true }
    });

    res.json(rows.map(r => ({
      associationId: r.id,
      role: r.role,
      restaurant: {
        id: r.restaurant.id,
        name: r.restaurant.name,
        type: r.restaurant.type,
        logo: r.restaurant.logo,
        description: r.restaurant.description
      }
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const access = await prisma.userRestaurant.findFirst({
      where: { user_id: req.userId, restaurant_id: restaurantId }
    });
    
    if (!access) {
      return res.status(403).json({ error: 'No tienes acceso a este restaurante' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await prisma.order.findMany({
      where: {
        restaurant_id: restaurantId,
        created_at: { gte: today, lt: tomorrow }
      },
      orderBy: { created_at: 'desc' },
      include: { items: { include: { options: true } } }
    });

    const activeReservations = await prisma.reservation.findMany({
      where: {
        restaurant_id: restaurantId,
        start_time: { gte: today }
      },
      orderBy: { start_time: 'asc' }
    });

    const topItems = await prisma.itemStat.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { count: 'desc' },
      take: 5
    });

    const summary = {
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0),
      pendingOrders: todayOrders.filter(o => o.status === 'pending').length,
      activeReservations: activeReservations.length
    };

    res.json({
      restaurantId,
      myRole: access.role,
      summary,
      orders: todayOrders.map(o => ({
        id: o.id,
        userId: o.user_id,
        items: o.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
        total: parseFloat(o.total),
        status: o.status,
        statusNote: o.status_note,
        paymentMethod: o.payment_method,
        deliveryCode: o.delivery_code,
        createdAt: o.created_at
      })),
      reservations: activeReservations.map(r => ({
        number: r.table_number,
        startTime: r.start_time,
        endTime: r.end_time,
        code: r.code,
        userId: r.user_id
      })),
      topItems: topItems.map(t => ({
        itemKey: t.item_key,
        count: t.count
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, statusNote } = req.body;
    
    const validStatuses = ['pending', 'processing', 'delivering', 'delivered', 'issue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    
    const access = await prisma.userRestaurant.findFirst({
      where: { user_id: req.userId, restaurant_id: order.restaurant_id }
    });
    
    if (!access) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        status_note: statusNote || null,
        updated_at: new Date()
      }
    });

    res.json({
      id: updated.id,
      status: updated.status,
      statusNote: updated.status_note,
      updatedAt: updated.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};