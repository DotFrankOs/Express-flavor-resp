const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

class ReportRepository extends BaseRepository {
  constructor() {
    super(prisma.report);
  }

  async findAllOrdered() {
    return this.findMany({}, { orderBy: { date: 'desc' } });
  }
}

module.exports = new ReportRepository();