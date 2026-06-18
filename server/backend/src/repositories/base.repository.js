class BaseRepository {
  constructor(dbAdapter, modelName) {
    this.db = dbAdapter;
    this.model = modelName;
  }

  async findMany(where = {}, options = {}) {
    return this.db.findMany(this.model, where, options);
  }

  async findUnique(where) {
    return this.db.findUnique(this.model, where);
  }

  async findFirst(where) {
    return this.db.findFirst(this.model, where);
  }

  async create(data) {
    return this.db.create(this.model, data);
  }

  async update(where, data) {
    return this.db.update(this.model, where, data);
  }

  async delete(where) {
    return this.db.delete(this.model, where);
  }

  async deleteMany(where) {
    return this.db.deleteMany(this.model, where);
  }

  async count(where = {}) {
    return this.db.count(this.model, where);
  }

  async upsert(where, update, create) {
    return this.db.upsert(this.model, where, update, create);
  }

  async transaction(callback) {
    return this.db.transaction(callback);
  }
}

module.exports = BaseRepository;