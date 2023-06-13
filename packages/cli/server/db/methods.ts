import { type FindOptions, type OrderItem } from '@appsemble/node-utils';
import { type JsonDB } from 'node-json-db';

import { getAppDir } from './app.js';

interface ResourceDefaults {
  AppId: number;
  $created: Date;
  $updated: Date;
  expires: Date | null;
}

const defaults: ResourceDefaults = {
  AppId: 1,
  $created: new Date(),
  $updated: new Date(),
  expires: null,
};

function applyQuery<M>(entity: M, key: string, subQuery: Record<string, any>): boolean {
  if (subQuery == null && entity[key as keyof M] == null) {
    return true;
  }

  if (subQuery === undefined && entity[key as keyof M] === undefined) {
    return true;
  }

  if (subQuery.gt) {
    return entity[key as keyof M] > subQuery.gt;
  }

  if (subQuery.gte) {
    return entity[key as keyof M] >= subQuery.gte;
  }

  if (subQuery.lt) {
    return entity[key as keyof M] < subQuery.lt;
  }

  if (subQuery.lte) {
    return entity[key as keyof M] <= subQuery.lte;
  }

  if (subQuery.eq) {
    return entity[key as keyof M] === subQuery.eq;
  }

  if (subQuery.ne) {
    return entity[key as keyof M] !== subQuery.ne;
  }

  return entity[key as keyof M] === subQuery;
}

function applyWhere<M>(entity: M, where: Record<string, any>): boolean {
  return Object.keys(where).every((key) => {
    const { and, or } = where[key];

    if (or && Array.isArray(or)) {
      return or.some((subQuery) => applyQuery(entity, key, subQuery));
    }

    if (and && Array.isArray(and)) {
      return and.every((subQuery) => applyQuery(entity, key, subQuery));
    }

    return applyQuery(entity, key, where[key]);
  });
}

function applyOr<M>(entities: M[], or: Record<string, any>[]): M[] {
  return entities.filter((entity) => or.some((subQuery) => applyWhere(entity, subQuery)));
}

function applyAnd<M>(entities: M[], and: Record<string, any>[]): M[] {
  return entities.filter((entity) => and.every((subQuery) => applyWhere(entity, subQuery)));
}

function applyAttributes<M>(entities: M[], attributes: string[]): M[] {
  return entities.map((entity) => {
    const result = {} as M;
    for (const attribute of attributes) {
      if (entity[attribute as keyof M] !== undefined) {
        result[attribute as keyof M] = entity[attribute as keyof M];
      }
    }
    return result;
  });
}

function applyOrder<M>(entities: M[], order: OrderItem[]): void {
  for (const orderItem of order) {
    entities.sort((a, b) => {
      const [property, direction] = orderItem;
      if (a[property as keyof typeof a] > b[property as keyof typeof b]) {
        return direction === 'DESC' ? -1 : 1;
      }

      if (a[property as keyof typeof a] < b[property as keyof typeof b]) {
        return direction === 'DESC' ? 1 : -1;
      }

      return 0;
    });
  }
}

export const Methods = {
  async create<M>(db: JsonDB, values: Record<string, unknown>, modelDir = '/'): Promise<M> {
    const existing = await this.findAll(db, {}, modelDir);
    const dir = `${getAppDir()}/${modelDir}`;
    const payload = {
      ...values,
      id: existing.length + 1,
      type: modelDir.slice(modelDir.indexOf('/') + 1 || 0),
      ...defaults,
    };
    await db.push(dir, payload, true);
    return payload as M;
  },

  async bulkCreate<M>(
    db: JsonDB,
    values: Record<string, unknown>[],
    modelDir = '/',
    override = false,
  ): Promise<M[] | []> {
    const existing = await this.findAll(db, {}, modelDir);
    const dir = `${getAppDir()}/${modelDir}`;
    const payload = values.map((value, index) => ({
      ...value,
      id: existing.length + index + 1,
      type: modelDir.slice(modelDir.indexOf('/') + 1 || 0),
      ...defaults,
    }));
    await db.push(dir, payload, override);
    return payload as M[];
  },

  async findById<M>(db: JsonDB, id: number | string, modelDir = '/'): Promise<M | null> {
    try {
      const dir = `${getAppDir()}/${modelDir}`;
      const entityIndex = await db.getIndex(dir, id);
      return await db.getObject<M>(`${dir}[${entityIndex}]`);
    } catch {
      return null;
    }
  },

  async findOne<M>(db: JsonDB, query: FindOptions, modelDir = '/'): Promise<M | null> {
    try {
      const dir = `${getAppDir()}/${modelDir}`;
      const entities = await db.getObject<M[]>(dir);

      let mapped = entities;
      if (query.attributes && query.attributes.length > 0) {
        mapped = applyAttributes(mapped, query.attributes);
      }

      let filtered = mapped;

      if (query.where) {
        if (query.where.and) {
          filtered = applyAnd(filtered, query.where.and);
        }

        if (query.where.or) {
          filtered = applyOr(filtered, query.where.or);
        }
      }

      const sorted = filtered;
      if (query.order) {
        applyOrder(sorted, query.order);
      }

      return sorted[0] || null;
    } catch {
      return null;
    }
  },

  async findAll<M>(db: JsonDB, query: FindOptions = {}, modelDir = '/'): Promise<M[] | []> {
    try {
      const dir = `${getAppDir()}/${modelDir}`;
      const entities = await db.getObject<M[]>(dir);

      const sliced = entities.slice(
        query.offset || 0,
        ((query.limit ? query.limit - 1 + (query.offset || 0) : 0) || entities.length) + 1,
      );

      let mapped = sliced;
      if (query.attributes && query.attributes.length > 0) {
        mapped = applyAttributes(mapped, query.attributes);
      }

      let filtered = mapped;

      if (query.where) {
        if (query.where.or) {
          filtered = applyOr(filtered, query.where.or);
        }

        if (query.where.and) {
          filtered = applyAnd(filtered, query.where.and);
        }
      }

      const sorted = filtered;
      if (query.order) {
        applyOrder(sorted, query.order);
      }

      return sorted;
    } catch {
      return [];
    }
  },

  async updateOne<M>(
    db: JsonDB,
    id: number | string,
    values: Record<string, unknown>,
    modelDir = '/',
  ): Promise<M> {
    try {
      const dir = `${getAppDir()}/${modelDir}`;
      const entityIndex = await db.getIndex(dir, id);
      const existing = await this.findById<M>(db, id, modelDir);
      await db.push(`${dir}[${entityIndex}]`, { ...existing, ...values }, true);
      return this.findOne<M>(db, { where: values }, modelDir);
    } catch {
      return null;
    }
  },

  async deleteOne(db: JsonDB, id: number | string, modelDir = '/'): Promise<void> {
    try {
      const dir = `${getAppDir()}/${modelDir}`;
      const entityIndex = await db.getIndex(dir, id);
      return await db.delete(`${dir}[${entityIndex}]`);
    } catch {
      return null;
    }
  },
};
