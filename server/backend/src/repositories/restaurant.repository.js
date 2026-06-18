const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

class RestaurantRepository extends BaseRepository {
  constructor() {
    super(prisma.restaurant);
  }
}

module.exports = new RestaurantRepository();