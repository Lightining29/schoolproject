import { Op } from 'sequelize';
import crypto from 'crypto';

export const generateId = () => crypto.randomBytes(12).toString('hex');

// Convert MongoDB style filter object to Sequelize where clause
export function convertMongoFilterToSequelize(filter) {
  if (!filter || typeof filter !== 'object') return {};
  const where = {};

  for (const [key, value] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(value)) {
      where[Op.or] = value.map(v => convertMongoFilterToSequelize(v));
      continue;
    }
    if (key === '$and' && Array.isArray(value)) {
      where[Op.and] = value.map(v => convertMongoFilterToSequelize(v));
      continue;
    }

    if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
      // Check for operators: $ne, $in, $nin, $gt, $gte, $lt, $lte, $regex
      const sub = {};
      let hasOp = false;

      for (const [opKey, opVal] of Object.entries(value)) {
        if (opKey === '$ne') {
          sub[Op.ne] = opVal;
          hasOp = true;
        } else if (opKey === '$in') {
          sub[Op.in] = Array.isArray(opVal) ? opVal : [opVal];
          hasOp = true;
        } else if (opKey === '$nin') {
          sub[Op.notIn] = Array.isArray(opVal) ? opVal : [opVal];
          hasOp = true;
        } else if (opKey === '$gt') {
          sub[Op.gt] = opVal;
          hasOp = true;
        } else if (opKey === '$gte') {
          sub[Op.gte] = opVal;
          hasOp = true;
        } else if (opKey === '$lt') {
          sub[Op.lt] = opVal;
          hasOp = true;
        } else if (opKey === '$lte') {
          sub[Op.lte] = opVal;
          hasOp = true;
        } else if (opKey === '$regex') {
          const pattern = opVal instanceof RegExp ? opVal.source : String(opVal);
          const cleanPattern = pattern.replace(/^\^/, '').replace(/\$$/, '');
          sub[Op.like] = cleanPattern;
          hasOp = true;
        }
      }

      if (hasOp) {
        where[key] = sub;
      } else {
        where[key] = value;
      }
    } else {
      where[key] = value;
    }
  }

  return where;
}

// Convert sort option to Sequelize order array
export function convertSort(sortObj) {
  if (!sortObj) return [];
  if (typeof sortObj === 'string') {
    return sortObj.trim().split(/\s+/).map(field => {
      if (field.startsWith('-')) return [field.slice(1), 'DESC'];
      return [field, 'ASC'];
    });
  }
  if (typeof sortObj === 'object' && !Array.isArray(sortObj)) {
    return Object.entries(sortObj).map(([field, dir]) => {
      const direction = (dir === -1 || dir === 'desc' || dir === 'DESC') ? 'DESC' : 'ASC';
      return [field, direction];
    });
  }
  return [];
}

// QueryBuilder enables chaining: .sort(), .populate(), .select(), .lean(), .limit(), .skip()
export class QueryBuilder {
  constructor(modelWrapper, filter = {}, isFindOne = false) {
    this.modelWrapper = modelWrapper;
    this.filter = filter;
    this.isFindOne = isFindOne;
    this._order = [];
    this._populates = [];
    this._select = null;
    this._lean = false;
    this._limit = null;
    this._offset = null;
  }

  sort(sortObj) {
    this._order = convertSort(sortObj);
    return this;
  }

  populate(pathOrObj, selectFields) {
    if (!pathOrObj) return this;
    if (typeof pathOrObj === 'string') {
      const paths = pathOrObj.trim().split(/\s+/);
      for (const p of paths) {
        this._populates.push({ path: p, select: selectFields });
      }
    } else if (typeof pathOrObj === 'object') {
      this._populates.push({
        path: pathOrObj.path,
        select: pathOrObj.select || selectFields
      });
    }
    return this;
  }

  select(fields) {
    if (typeof fields === 'string') {
      this._select = fields.trim().split(/\s+/);
    } else if (Array.isArray(fields)) {
      this._select = fields;
    }
    return this;
  }

  lean() {
    this._lean = true;
    return this;
  }

  limit(n) {
    this._limit = Number(n);
    return this;
  }

  skip(n) {
    this._offset = Number(n);
    return this;
  }

  async exec() {
    const rawModel = this.modelWrapper.rawModel;
    const where = convertMongoFilterToSequelize(this.filter);

    const queryOptions = { where };
    if (this._order.length > 0) queryOptions.order = this._order;
    if (this._limit !== null) queryOptions.limit = this._limit;
    if (this._offset !== null) queryOptions.offset = this._offset;

    if (this._select && this._select.length > 0) {
      const excludes = this._select.filter(f => f.startsWith('-')).map(f => f.slice(1));
      const includes = this._select.filter(f => !f.startsWith('-') && !f.startsWith('+'));
      const forceIncludes = this._select.filter(f => f.startsWith('+')).map(f => f.slice(1));

      if (excludes.length > 0) {
        queryOptions.attributes = { exclude: excludes };
      } else if (includes.length > 0) {
        queryOptions.attributes = [...includes, ...forceIncludes];
      }
    }

    if (this.isFindOne) {
      const record = await rawModel.findOne(queryOptions);
      if (!record) return null;
      let resObj = record;
      if (this._populates.length > 0) {
        resObj = await this.populateItem(resObj, this._populates);
      }
      return this._lean ? (resObj.toObject ? resObj.toObject() : resObj) : resObj;
    } else {
      const records = await rawModel.findAll(queryOptions);
      let results = records;
      if (this._populates.length > 0) {
        results = await Promise.all(results.map(rec => this.populateItem(rec, this._populates)));
      }
      return this._lean
        ? results.map(r => (r.toObject ? r.toObject() : r))
        : results;
    }
  }

  async populateItem(item, populates) {
    const Models = (await import('./db.js')).getModels();
    for (const pop of populates) {
      const path = pop.path;
      const select = pop.select ? pop.select.split(' ') : null;

      const pickFields = (obj) => {
        if (!obj || !select) return obj;
        const res = {};
        for (const k of select) {
          if (obj[k] !== undefined) res[k] = obj[k];
        }
        return res;
      };

      if (path === 'parentId' && item.parentId && Models.Parent) {
        const parent = await Models.Parent.findById(item.parentId);
        if (parent) {
          const plain = parent.toObject ? parent.toObject() : parent;
          item.parentId = pickFields(plain);
        }
      } else if (path === 'teacherId' && item.teacherId && Models.Teacher) {
        const teacher = await Models.Teacher.findById(item.teacherId);
        if (teacher) {
          const plain = teacher.toObject ? teacher.toObject() : teacher;
          item.teacherId = pickFields(plain);
        }
      } else if (path === 'studentId' && item.studentId && Models.Student) {
        const student = await Models.Student.findById(item.studentId);
        if (student) {
          const plain = student.toObject ? student.toObject() : student;
          item.studentId = pickFields(plain);
        }
      } else if (path === 'feeId' && item.feeId && Models.Fee) {
        const fee = await Models.Fee.findById(item.feeId);
        if (fee) {
          const plain = fee.toObject ? fee.toObject() : fee;
          item.feeId = pickFields(plain);
        }
      } else if (path === 'children' && item.children && Models.Student) {
        const childIds = Array.isArray(item.children) ? item.children : [];
        if (childIds.length > 0) {
          const kids = await Models.Student.find({ _id: { $in: childIds } });
          item.children = kids.map(k => (k.toObject ? k.toObject() : k));
        }
      }
    }
    return item;
  }

  // Thenable for async/await
  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

// Wrapper for Sequelize model providing Mongoose-compatible API
export function wrapModel(rawModel) {
  // Ensure prototype has toObject and populate
  rawModel.prototype.toObject = function () {
    const json = this.toJSON ? this.toJSON() : { ...this };
    return json;
  };

  rawModel.prototype.populate = async function (pathOrObj, select) {
    const qb = new QueryBuilder({ rawModel }, {}, true);
    qb.populate(pathOrObj, select);
    await qb.populateItem(this, qb._populates);
    return this;
  };

  const wrapper = {
    rawModel,

    find(filter = {}) {
      return new QueryBuilder(wrapper, filter, false);
    },

    findOne(filter = {}) {
      return new QueryBuilder(wrapper, filter, true);
    },

    findById(id) {
      if (!id) return new QueryBuilder(wrapper, { _id: null }, true);
      const cleanId = typeof id === 'object' && id._id ? id._id : id.toString();
      return new QueryBuilder(wrapper, { _id: cleanId }, true);
    },

    async create(data) {
      const payload = { ...data };
      if (!payload._id) payload._id = generateId();
      const instance = await rawModel.create(payload);
      return instance;
    },

    async insertMany(docs) {
      if (!Array.isArray(docs)) return [];
      const prepared = docs.map(d => ({
        ...d,
        _id: d._id || generateId()
      }));
      const instances = await rawModel.bulkCreate(prepared);
      return instances;
    },

    async countDocuments(filter = {}) {
      const where = convertMongoFilterToSequelize(filter);
      return await rawModel.count({ where });
    },

    async findByIdAndUpdate(id, updateData, options = { new: true }) {
      const cleanId = typeof id === 'object' && id._id ? id._id : id.toString();
      const item = await rawModel.findOne({ where: { _id: cleanId } });
      if (!item) return null;
      await item.update(updateData);
      return item;
    },

    async findByIdAndDelete(id) {
      const cleanId = typeof id === 'object' && id._id ? id._id : id.toString();
      const item = await rawModel.findOne({ where: { _id: cleanId } });
      if (!item) return null;
      await item.destroy();
      return item;
    },

    async findByIdAndRemove(id) {
      return this.findByIdAndDelete(id);
    },

    async updateMany(filter = {}, updateData = {}) {
      const where = convertMongoFilterToSequelize(filter);
      // Support { $set: ... }
      const fields = updateData.$set ? updateData.$set : updateData;
      const [affectedCount] = await rawModel.update(fields, { where });
      return { modifiedCount: affectedCount };
    },

    async deleteOne(filter = {}) {
      const where = convertMongoFilterToSequelize(filter);
      const item = await rawModel.findOne({ where });
      if (!item) return { deletedCount: 0 };
      await item.destroy();
      return { deletedCount: 1 };
    },

    async deleteMany(filter = {}) {
      const where = convertMongoFilterToSequelize(filter);
      const count = await rawModel.destroy({ where });
      return { deletedCount: count };
    },

    async aggregate(pipeline = []) {
      // Handles [{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]
      const match = pipeline.find(p => p.$match)?.$match || {};
      const where = convertMongoFilterToSequelize(match);
      const total = await rawModel.sum('amount', { where });
      return [{ _id: null, total: total || 0 }];
    }
  };

  return wrapper;
}
