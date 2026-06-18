class TableLayoutDTO {
  static fromRaw(data) {
    if (!data) {
      return { columns: 5, gap: '10px' };
    }
    return {
      columns: data.columns ?? 5,
      gap: data.gap ?? '10px'
    };
  }
}

module.exports = TableLayoutDTO;