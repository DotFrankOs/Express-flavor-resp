class UserDTO {
  static fromRaw(data) {
    if (!data) return null;
    return {
      user: data.user,
      name: data.name,
      email: data.email,
      phone: data.phone,
      avatar: data.avatar,
      role: data.role,
      ordersCount: data.orders_count ?? data.ordersCount ?? 0,
      favorites: typeof data.favorites === 'string'
        ? JSON.parse(data.favorites || '[]')
        : (data.favorites || [])
    };
  }

  static forAuthResponse(data, token) {
    return {
      token,
      ...this.fromRaw(data)
    };
  }

  static forPublicProfile(data) {
    const dto = this.fromRaw(data);
    delete dto.ordersCount;
    delete dto.favorites;
    return dto;
  }
}

module.exports = UserDTO;