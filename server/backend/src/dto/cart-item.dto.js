class CartItemDTO {
  static fromRaw(data) {
    if (!data) return null;

    const variant = data.variant;
    const options = data.options;

    return {
      id: data.id,
      name: data.name,
      baseName: data.base_name ?? data.baseName,
      price: parseFloat(data.price ?? 0),
      basePrice: parseFloat(data.base_price ?? data.basePrice ?? 0),
      restaurantId: data.restaurant_id ?? data.restaurantId,
      restaurantName: data.restaurant_name ?? data.restaurantName,
      quantity: data.quantity ?? 1,
      variant: typeof variant === 'string' ? JSON.parse(variant) : variant,
      options: typeof options === 'string' ? JSON.parse(options || '[]') : (options || []),
      image: data.image
    };
  }

  static fromRawList(dataList) {
    if (!Array.isArray(dataList)) return [];
    return dataList.map(d => this.fromRaw(d));
  }

  static toRepositoryFormat(data, userId) {
    return {
      id: data.id,
      user_id: userId,
      name: data.name,
      base_name: data.baseName || data.name,
      price: data.price,
      base_price: data.basePrice || data.price,
      restaurant_id: data.restaurantId,
      restaurant_name: data.restaurantName,
      quantity: data.quantity,
      variant: data.variant ? JSON.stringify(data.variant) : null,
      options: data.options ? JSON.stringify(data.options) : null,
      image: data.image || null
    };
  }
}

module.exports = CartItemDTO;