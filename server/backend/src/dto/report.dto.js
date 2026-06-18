class ReportDTO {
  static fromRaw(data) {
    if (!data) return null;
    return {
      id: data.id,
      description: data.description,
      image: data.image,
      date: data.date,
      userId: data.user_id ?? data.userId
    };
  }

  static fromRawList(dataList) {
    if (!Array.isArray(dataList)) return [];
    return dataList.map(d => this.fromRaw(d));
  }
}

module.exports = ReportDTO;