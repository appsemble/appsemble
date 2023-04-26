import { FindOptions } from '@appsemble/node-utils/server/types.js';

import { getAppDir } from './app.js';
import { db } from './index.js';

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

export const Methods = {
  async create<M>(values: Record<string, unknown>, modelDir = '/'): Promise<M> {
    const existing = await this.findAll({}, modelDir);
    const dir = `${getAppDir()}/${modelDir}`;
    await db.push(
      dir,
      {
        ...values,
        id: existing.length + 1,
        type: modelDir.slice(modelDir.indexOf('/') + 1 || 1),
        ...defaults,
      },
      true,
    );
    return this.findOne({ where: values }, dir);
  },

  async bulkCreate<M>(
    values: Record<string, unknown>[],
    modelDir = '/',
    override = false,
  ): Promise<M[] | []> {
    const existing = await this.findAll({}, modelDir);
    const dir = `${getAppDir()}/${modelDir}`;
    await db.push(
      dir,
      values.map((value) => ({
        ...value,
        id: existing.length + 1,
        type: modelDir.slice(modelDir.indexOf('/') + 1 || 1),
        ...defaults,
      })),
      override,
    );
    return this.findAll({}, modelDir);
  },

  async findById<M>(id: number | string, modelDir = '/'): Promise<M | null> {
    try {
      const dir = `${getAppDir()}/${modelDir}`;
      const entityIndex = await db.getIndex(dir, id);
      return await db.getObject<M>(`${dir}[${entityIndex}]`);
    } catch {
      return null;
    }
  },

  async findOne<M>(query: FindOptions, modelDir = '/'): Promise<M | null> {
    try {
      const dir = `${getAppDir()}/${modelDir}`;
      const entities = await db.getObject<M[]>(dir);

      const mapped =
        query.attributes && query.attributes.length > 0
          ? entities.map((entity) => {
              const result = {} as M;
              for (const attribute of query.attributes) {
                if (entity[attribute as keyof M] !== undefined) {
                  result[attribute as keyof M] = entity[attribute as keyof M];
                }
              }
              return result;
            })
          : entities;

      let filtered = mapped;

      if (query.where.and) {
        filtered = applyAnd(filtered, query.where.and);
      }

      if (query.where.or) {
        filtered = applyOr(filtered, query.where.or);
      }

      return filtered[0] || null;
    } catch {
      return null;
    }
  },

  async findAll<M>(query: FindOptions = {}, modelDir = '/'): Promise<M[] | []> {
    try {
      const dir = `${getAppDir()}/${modelDir}`;
      const entities = await db.getObject<M[]>(dir);

      const sliced = entities.slice(
        query.offset || 0,
        ((query.limit ? query.limit - 1 + (query.offset || 0) : 0) || entities.length) + 1,
      );

      const mapped =
        query.attributes && query.attributes.length > 0
          ? sliced.map((entity) => {
              const result = {} as M;
              for (const attribute of query.attributes) {
                if (entity[attribute as keyof M] !== undefined) {
                  result[attribute as keyof M] = entity[attribute as keyof M];
                }
              }
              return result;
            })
          : sliced;

      let filtered = mapped;

      if (query.where.or) {
        filtered = applyOr(filtered, query.where.or);
      }

      if (query.where.and) {
        filtered = applyAnd(filtered, query.where.and);
      }

      const sorted = filtered;
      if (query.order) {
        for (const orderItem of query.order) {
          sorted.sort((a, b) => {
            const { direction, property } = orderItem;
            if (a[property as keyof typeof a] > b[property as keyof typeof b]) {
              return Number(direction);
            }

            if (a[property as keyof typeof a] < b[property as keyof typeof b]) {
              return direction * -1;
            }

            return 0;
          });
        }
      }

      return sorted;
    } catch {
      return [];
    }
  },

  async updateOne<M>(
    id: number | string,
    values: Record<string, unknown>,
    modelDir = '/',
  ): Promise<M> {
    try {
      const dir = `${getAppDir()}/${modelDir}`;
      const entityIndex = await db.getIndex(dir, id);
      await db.push(`${dir}[${entityIndex}]`, values, true);
      return this.findOne({ where: values }, dir);
    } catch {
      return null;
    }
  },

  async deleteOne(id: number | string, modelDir = '/'): Promise<void> {
    try {
      const dir = `${getAppDir()}/${modelDir}`;
      const entityIndex = await db.getIndex(dir, id);
      return await db.delete(`${dir}[${entityIndex}]`);
    } catch {
      return null;
    }
  },
};
