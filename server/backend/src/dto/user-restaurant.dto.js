class UserRestaurantDTO {
  static forDashboard(data) {
    if (!data) return null;

    const { access, summary, orders, reservations, topItems } = data;

    return {
      restaurantId: access.restaurant_id ?? access.restaurantId,
      myRole: access.role,
      summary: {
        todayOrders: summary.todayOrders ?? 0,
        todayRevenue: summary.todayRevenue ?? 0,
        pendingOrders: summary.pendingOrders ?? 0,
        activeReservations: summary.activeReservations ?? 0
      },
      orders: (orders ?? []).map(o => ({
        id: o.id,
        userId: o.user_id ?? o.userId,
        items: (o.items ?? []).map(item => ({
          name: item.name,
          quantity: item.quantity ?? 1,
          price: parseFloat(item.price ?? 0)
        })),
        total: parseFloat(o.total ?? 0),
        status: o.status,
        statusNote: o.status_note ?? o.statusNote,
        paymentMethod: o.payment_method ?? o.paymentMethod,
        deliveryCode: o.delivery_code ?? o.deliveryCode,
        createdAt: o.created_at ?? o.createdAt
      })),
      reservations: (reservations ?? []).map(r => ({
        number: r.table_number ?? r.number,
        startTime: r.start_time ?? r.startTime,
        endTime: r.end_time ?? r.endTime,
        code: r.code,
        userId: r.user_id ?? r.userId
      })),
      topItems: (topItems ?? []).map(t => ({
        itemKey: t.item_key ?? t.itemKey,
        count: t.count ?? 0
      }))
    };
  }
}

module.exports = UserRestaurantDTO;