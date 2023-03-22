import { db } from './index.js';
import { FindOptions } from './types.js';

export const Methods = {
  async findOne<M>(query: FindOptions, dir = '/'): Promise<M | null> {
    const entities = await db.getObject<M[]>(dir);
    return entities.find((app: M) =>
      Object.keys(query.where).every((key) => app[key as keyof M] === query.where[key]),
    );
  },

  async findAll<M>(query: FindOptions, dir = '/'): Promise<M[] | []> {
    const entities = await db.getObject<M[]>(dir);
    return entities.filter((entity) =>
      Object.keys(query.where).every((key) => entity[key as keyof M] === query.where[key]),
    );
  },
};
