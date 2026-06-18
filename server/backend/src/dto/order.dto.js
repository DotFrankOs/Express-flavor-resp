const OrderItemDTO = require('./order-item.dto');

class OrderDTO {
  static fromRaw(data) {
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id ?? data.userId,
      restaurantId: data.restaurant_id ?? data.restaurantId,
      restaurantName: data.restaurant_name ?? data.restaurantName,
      items: (data.items ?? data.order_items)?.map(i => OrderItemDTO.fromRaw(i)) || [],
      total: parseFloat(data.total ?? 0),
      paymentMethod: data.payment_method ?? data.paymentMethod,
      deliveryCode: data.delivery_code ?? data.deliveryCode,
      status: data.status,
      statusNote: data.status_note ?? data.statusNote,
      createdAt: data.created_at ?? data.createdAt,
      updatedAt: data.updated_at ?? data.updatedAt
    };
  }

  static fromRawList(dataList) {
    if (!Array.isArray(dataList)) return [];
    return dataList.map(d => this.fromRaw(d));
  }

  static forCreationResponse(order, items, deliveryCode) {
    if (!order) return null;
    return {
      id: order.id,
      userId: order.user_id ?? order.userId,
      restaurantId: order.restaurant_id ?? order.restaurantId,
      restaurantName: order.restaurant_name ?? order.restaurantName,
      items: Array.isArray(items) ? items : [],
      total: parseFloat(order.total ?? 0),
      paymentMethod: order.payment_method ?? order.paymentMethod,
      deliveryCode: deliveryCode || order.delivery_code || order.deliveryCode,
      status: order.status,
      statusNote: order.status_note ?? order.statusNote,
      createdAt: order.created_at ?? order.createdAt
    };
  }
}

module.exports = OrderDTO;