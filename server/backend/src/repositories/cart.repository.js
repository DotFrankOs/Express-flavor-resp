const BaseRepository = require('./base.repository');

class CartRepository extends BaseRepository {
  constructor(dbAdapter) {
    super(dbAdapter, 'cartItem');
  }

  async findByUserId(userId) {
    const rows = await this.findMany({ user_id: userId });
    return rows.map(row => ({
      ...row,
      variant: this._parseJson(row.variant),
      options: this._parseJson(row.options)
    }));
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
            variant: this._stringifyJson(item.variant),
            options: this._stringifyJson(item.options),
            image: item.image || null
          }
        });
      }
    });
  }
}

module.exports = CartRepository;