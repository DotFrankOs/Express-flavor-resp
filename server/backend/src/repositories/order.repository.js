const BaseRepository = require('./base.repository');

class OrderRepository extends BaseRepository {
  constructor(dbAdapter) {
    super(dbAdapter, 'order');
  }

  async findByUserId(userId) {
    return this.findMany(
      { user_id: userId },
      {
        orderBy: { created_at: 'desc' },
        include: { items: { include: { options: true } } }
      }
    );
  }

  async findByIdWithItems(orderId) {
    return this.findUnique(
      { id: orderId },
      { include: { items: { include: { options: true } } } }
    );
  }

  async findTodayOrders(restaurantId, today, tomorrow) {
    return this.findMany(
      {
        restaurant_id: restaurantId,
        created_at: { gte: today, lt: tomorrow }
      },
      {
        orderBy: { created_at: 'desc' },
        include: { items: { include: { options: true } } }
      }
    );
  }

  async createWithItems(orderData, items) {
    return this.transaction(async (tx) => {
      const order = await tx.order.create({ data: orderData });

      for (const item of items) {
        const orderItemId = `${order.id}_${item.id}`;
        
        await tx.orderItem.create({
          data: {
            id: orderItemId,
            order_id: order.id,
            item_id: item.id,
            name: item.name,
            base_name: item.baseName || item.name,
            price: item.price,
            base_price: item.basePrice || item.price,
            quantity: item.quantity,
            variant: this._stringifyJson(item.variant),
            image: item.image || null
          }
        });

        if (item.options?.length > 0) {
          for (const opt of item.options) {
            await tx.orderItemOption.create({
              data: {
                order_item_id: orderItemId,
                choice_id: opt.choiceId,
                choice_name: opt.choiceName,
                price_modifier: opt.priceModifier || 0
              }
            });
          }
        }
      }

      return order;
    });
  }
}

module.exports = OrderRepository;