class RestaurantDTO {
  static fromRaw(data) {
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      logo: data.logo,
      description: data.description,
      url: data.url,
      minDuration: data.min_duration ?? data.minDuration,
      maxDuration: data.max_duration ?? data.maxDuration
    };
  }

  static fromRawList(dataList) {
    if (!Array.isArray(dataList)) return [];
    return dataList.map(d => this.fromRaw(d));
  }

  static forStaffList(association) {
    if (!association) return null;
    return {
      associationId: association.id,
      role: association.role,
      restaurant: this.fromRaw(association.restaurant)
    };
  }
}

module.exports = RestaurantDTO;