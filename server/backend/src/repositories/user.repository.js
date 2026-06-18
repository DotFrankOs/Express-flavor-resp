const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
  constructor(dbAdapter) {
    super(dbAdapter, 'user');
  }

  async findByUsername(username) {
    return this.findUnique({ user: username });
  }

  async incrementOrdersCount(userId) {
    return this.update(
      { user: userId },
      { orders_count: { increment: 1 } }
    );
  }
}

module.exports = UserRepository;