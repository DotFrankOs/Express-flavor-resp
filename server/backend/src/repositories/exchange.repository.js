const BaseRepository = require('./base.repository');

class ExchangeRepository extends BaseRepository {
  constructor(dbAdapter) {
    super(dbAdapter, 'exchangeRate');
  }
}

module.exports = ExchangeRepository;