const BaseRepository = require('./base.repository');

class ReportRepository extends BaseRepository {
  constructor(dbAdapter) {
    super(dbAdapter, 'report');
  }

  async findAllOrdered() {
    return this.findMany({}, { orderBy: { date: 'desc' } });
  }
}

module.exports = ReportRepository;