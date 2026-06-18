class ReservationDTO {
  static fromRaw(data) {
    if (!data) return null;

    const dto = {
      number: data.table_number ?? data.number,
      startTime: data.start_time ?? data.startTime,
      endTime: data.end_time ?? data.endTime,
      duration: data.duration,
      code: data.code,
      userId: data.user_id ?? data.userId
    };

    if (data.restaurant) {
      dto.restaurantId = data.restaurant_id ?? data.restaurantId;
      dto.restaurantName = data.restaurant.name;
    }

    return dto;
  }

  static fromRawList(dataList) {
    if (!Array.isArray(dataList)) return [];
    return dataList.map(d => this.fromRaw(d));
  }
}

module.exports = ReservationDTO;