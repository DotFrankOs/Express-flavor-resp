const { exchangeRepository } = require('../repositories');

class ExchangeService {
  constructor(repo) {
    this.repo = repo;
  }

  async getRates() {
    return this.repo.findMany();
  }
}

module.exports = new ExchangeService(exchangeRepository);