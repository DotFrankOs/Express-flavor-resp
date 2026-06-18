class TableDTO {
  static fromRaw(data) {
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      label: data.label,
      style: data.style
    };
  }

  static fromRawList(dataList) {
    if (!Array.isArray(dataList)) return [];
    return dataList.map(d => this.fromRaw(d));
  }
}

module.exports = TableDTO;