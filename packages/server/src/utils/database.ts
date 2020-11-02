import { FindOptions, Model, ModelCtor } from 'sequelize';

interface IterTableOptions extends Omit<FindOptions, 'limit' | 'offset'> {
  /**
   * How many entries to fetch at once.
   */
  chunkSize?: number;
}

/**
 * Iterate over all entries in a database table.
 *
 * @param model - The sequelize model to iteratr
 * @param options - Additional properties to pass to the Sequelize query.
 *
 * @yields All entries in the database table.
 */
export async function* iterTable<M extends Model>(
  model: ModelCtor<M>,
  { chunkSize = 100, ...options }: IterTableOptions = {},
): AsyncGenerator<M, void, undefined> {
  let offset = 0;
  let length = Infinity;
  while (chunkSize <= length) {
    const chunk = await model.findAll({ ...options, limit: chunkSize, offset });
    yield* chunk as M[];
    ({ length } = chunk);
    offset += length;
  }
}
