import { db } from './index.js';
import { FindOptions } from './types.js';

export const Methods = {
  async create<M>(values: Record<string, unknown>, dir = '/'): Promise<M> {
    await db.push(dir, values);
    return this.findOne({ where: values }, dir);
  },

  async findOne<M>(query: FindOptions, dir = '/'): Promise<M | null> {
    try {
      const entities = await db.getObject<M[]>(dir);
      return entities.find((app: M) =>
        Object.keys(query.where).every((key) => app[key as keyof M] === query.where[key]),
      );
    } catch {
      return null;
    }
  },

  async findAll<M>(query: FindOptions, dir = '/'): Promise<M[] | []> {
    try {
      const entities = await db.getObject<M[]>(dir);
      return entities.filter((entity) =>
        Object.keys(query.where).every((key) => entity[key as keyof M] === query.where[key]),
      );
    } catch {
      return null;
    }
  },
};
