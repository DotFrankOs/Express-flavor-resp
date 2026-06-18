class ItemStatDTO {
  static fromRaw(data) {
    if (!data) return null;
    return {
      itemId: data.item_key ?? data.itemId,
      count: data.count ?? 0
    };
  }

  static fromRawList(dataList) {
    if (!Array.isArray(dataList)) return [];
    return dataList.map(d => this.fromRaw(d));
  }

  static forVariants(dataList) {
    if (!Array.isArray(dataList)) return [];
    return dataList
      .map(s => ({
        variantId: (s.item_key ?? s.itemId).split('|')[1],
        count: s.count ?? 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  static forTopItems(dataList) {
    if (!Array.isArray(dataList)) return [];
    return dataList
      .filter(s => !(s.item_key ?? s.itemId).includes('|'))
      .map(s => this.fromRaw(s));
  }
}

module.exports = ItemStatDTO;