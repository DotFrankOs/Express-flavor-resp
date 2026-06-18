const { reportRepository } = require('../repositories');
const { generateReportId } = require('../utils/id-generator.utils');
const ApplicationError = require('../domain/errors/application-error');

class ReportService {
  constructor(repo) {
    this.repo = repo;
  }

  async getAll() {
    return this.repo.findAllOrdered();
  }

  async create(data, authenticatedUserId) {
    const { description, image, userId } = data;

    if (userId !== authenticatedUserId) {
      throw new ApplicationError('No autorizado', 403);
    }

    const id = generateReportId();
    const date = new Date();

    return this.repo.create({
      id,
      description,
      image,
      date,
      user_id: userId
    });
  }
}

module.exports = new ReportService(reportRepository);