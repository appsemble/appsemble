import { getAppDir } from './app.js';
import { db } from './index.js';
import { FindOptions } from './types.js';

export const Methods = {
  async create<M>(values: Record<string, unknown>, modelDir = '/'): Promise<M> {
    const dir = `${getAppDir()}/${modelDir}`;
    await db.push(dir, values, true);
    return this.findOne({ where: values }, dir);
  },

  async bulkCreate<M>(values: Record<string, unknown>[], modelDir = '/'): Promise<M> {
    const dir = `${getAppDir()}/${modelDir}`;
    await db.push(dir, values, true);
    return this.findOne({ where: values }, dir);
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

      return query.where
        ? mapped.find((app: M) =>
            Object.keys(query.where).every((key) => app[key as keyof M] === query.where[key]),
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

      return query.where
        ? mapped.filter((entity) =>
            Object.keys(query.where).every((key) => entity[key as keyof M] === query.where[key]),
          )
        : mapped;
    } catch {
      return null;
    }
  },
};
