const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

class CartRepository extends BaseRepository {
  constructor() {
    super(prisma.cartItem);
  }

  async findByUserId(userId) {
    return this.findMany({ user_id: userId });
  }

  async replaceAllForUser(userId, items) {
    return this.transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { user_id: userId } });
      
      for (const item of items) {
        await tx.cartItem.create({
          data: {
            id: item.id,
            user_id: userId,
            name: item.name,
            base_name: item.baseName || item.name,
            price: item.price,
            base_price: item.basePrice || item.price,
            restaurant_id: item.restaurantId,
            restaurant_name: item.restaurantName,
            quantity: item.quantity,
            variant: item.variant ? JSON.stringify(item.variant) : null,
            options: item.options ? JSON.stringify(item.options) : null,
            image: item.image || null
          }
        });
      }
    });
  }
}

module.exports = new CartRepository();