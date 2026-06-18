const BaseRepository = require('./base.repository');

class RestaurantRepository extends BaseRepository {
  constructor(dbAdapter) {
    super(dbAdapter, 'restaurant');
  }
}

module.exports = RestaurantRepository;