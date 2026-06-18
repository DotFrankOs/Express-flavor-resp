const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
  constructor() {
    super(prisma.user);
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

module.exports = new UserRepository();