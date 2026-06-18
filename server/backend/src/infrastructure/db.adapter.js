class DbAdapter {
  constructor(prismaClient) {
    this.client = prismaClient;
  }

  async findMany(model, where = {}, options = {}) {
    return this.client[model].findMany({ where, ...options });
  }

  async findUnique(model, where, options = {}) {
    return this.client[model].findUnique({ where, ...options });
  }

  async findFirst(model, where, options = {}) {
    return this.client[model].findFirst({ where, ...options });
  }

  async create(model, data) {
    return this.client[model].create({ data });
  }

  async update(model, where, data) {
    return this.client[model].update({ where, data });
  }

  async delete(model, where) {
    return this.client[model].delete({ where });
  }

  async deleteMany(model, where) {
    return this.client[model].deleteMany({ where });
  }

  async count(model, where = {}) {
    return this.client[model].count({ where });
  }

  async upsert(model, where, update, create) {
    return this.client[model].upsert({ where, update, create });
  }

  async transaction(callback) {
    return this.client.$transaction(callback);
  }

  async queryRaw(query, ...params) {
    return this.client.$queryRaw(query, ...params);
  }
}

module.exports = DbAdapter;