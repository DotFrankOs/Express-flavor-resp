class BaseRepository {
  constructor(dbAdapter, modelName) {
    this.db = dbAdapter;
    this.model = modelName;
  }

  async findMany(where = {}, options = {}) {
    return this.db.findMany(this.model, where, options);
  }

  async findUnique(where, options = {}) {
    return this.db.findUnique(this.model, where, options);
  }

  async findFirst(where, options = {}) {
    return this.db.findFirst(this.model, where, options);
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

  _parseJson(val) {
    if (!val) return null;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val;
  }

  _stringifyJson(val) {
    if (!val) return null;
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  }
}

module.exports = BaseRepository;