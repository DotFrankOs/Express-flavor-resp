class CartItemDTO {
  static fromRaw(data) {
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      baseName: data.base_name ?? data.baseName,
      price: parseFloat(data.price ?? 0),
      basePrice: parseFloat(data.base_price ?? data.basePrice ?? 0),
      restaurantId: data.restaurant_id ?? data.restaurantId,
      restaurantName: data.restaurant_name ?? data.restaurantName,
      quantity: data.quantity ?? 1,
      variant: data.variant,
      options: data.options ?? [],
      image: data.image
    };
  }

  static fromRawList(dataList) {
    if (!Array.isArray(dataList)) return [];
    return dataList.map(d => this.fromRaw(d));
  }
}

module.exports = CartItemDTO;