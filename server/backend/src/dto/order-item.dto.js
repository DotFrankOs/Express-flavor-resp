class OrderItemDTO {
  static fromRaw(data) {
    if (!data) return null;

    return {
      itemId: data.item_id ?? data.itemId,
      name: data.name,
      baseName: data.base_name ?? data.baseName,
      price: parseFloat(data.price ?? 0),
      basePrice: parseFloat(data.base_price ?? data.basePrice ?? 0),
      quantity: data.quantity ?? 1,
      variant: data.variant,
      options: (data.options ?? data.order_item_options)?.map(opt => ({
        choiceId: opt.choice_id ?? opt.choiceId,
        choiceName: opt.choice_name ?? opt.choiceName,
        priceModifier: parseFloat(opt.price_modifier ?? opt.priceModifier ?? 0)
      })) || [],
      image: data.image
    };
  }
}

module.exports = OrderItemDTO;