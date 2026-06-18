const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

class ExchangeRepository extends BaseRepository {
  constructor() {
    super(prisma.exchangeRate);
  }
}

module.exports = new ExchangeRepository();