import { FindOptions, operators } from '@appsemble/node-utils/server/types.js';

import { getAppDir } from './app.js';
import { db } from './index.js';

export const Methods = {
  async create<M>(values: Record<string, unknown>, modelDir = '/'): Promise<M> {
    const existing = await this.findAll({}, modelDir);
    const dir = `${getAppDir()}/${modelDir}`;
    await db.push(
      dir,
      { ...values, id: existing.length + 1, AppId: 1, $created: new Date(), $updated: new Date() },
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
        AppId: 1,
        $created: new Date(),
        $updated: new Date(),
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

      if (query.where.and) {
      }

      if (query.where.or) {
      }

      const cleanWhere = query.where as Record<string, any>;

      for (const operator of operators) {
        delete cleanWhere[operator];
      }

      return query.where
        ? mapped.find((entity: M) =>
            Object.keys(cleanWhere).every((key) => entity[key as keyof M] === cleanWhere[key]),
          )
        : mapped[0];
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

      console.log(mapped, query)

      if (query.where.and) {
      }

      if (query.where.or) {
      }

      const cleanWhere = query.where as Record<string, any>;

      for (const operator of operators) {
        delete cleanWhere[operator];
      }

      console.log('MAPPED', mapped)

      const filtered = query.where
        ? mapped.filter((entity) =>
            Object.keys(query.where).every((key) => entity[key as keyof M] === cleanWhere[key]),
          )
        : mapped;

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
