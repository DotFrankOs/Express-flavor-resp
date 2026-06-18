class MenuItemDTO {
  static fromRaw(data) {
    if (!data) return null;

    const dto = {
      id: data.id,
      name: data.name,
      price: parseFloat(data.price ?? 0),
      image: data.image,
      description: data.description
    };

    const options = data.options ?? data.menu_item_options;
    if (options && options.length > 0) {
      dto.options = options.map(opt => ({
        id: opt.option_id ?? opt.id,
        name: opt.name,
        required: opt.required,
        multiSelect: opt.multi_select ?? opt.multiSelect,
        choices: (opt.choices ?? opt.menu_item_option_choices)?.map(c => ({
          id: c.choice_id ?? c.id,
          name: c.name,
          priceModifier: parseFloat(c.price_modifier ?? c.priceModifier ?? 0)
        })) || []
      }));
    }

    const variants = data.variants ?? data.menu_item_variants;
    if (variants && variants.length > 0) {
      const v = variants[0];
      dto.variants = {
        required: v.required,
        items: (v.items ?? v.menu_item_variant_items)?.map(vi => ({
          id: vi.item_id ?? vi.id,
          name: vi.name,
          price: parseFloat(vi.price ?? 0)
        })) || []
      };
    }

    return dto;
  }

  static fromRawList(dataList) {
    if (!Array.isArray(dataList)) return [];
    return dataList.map(d => this.fromRaw(d));
  }
}

module.exports = MenuItemDTO;