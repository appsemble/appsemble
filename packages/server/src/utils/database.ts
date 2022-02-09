import { FindOptions, Model, ModelCtor } from 'sequelize';

interface IterTableOptions<M extends Model> extends Omit<FindOptions<M>, 'limit' | 'offset'> {
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
 * @yields All entries in the database table.
 */
export async function* iterTable<M extends Model>(
  model: ModelCtor<M>,
  { chunkSize = 100, ...options }: IterTableOptions<M> = {},
): AsyncGenerator<M, void, undefined> {
  let offset = 0;
  let length = Number.POSITIVE_INFINITY;
  while (chunkSize <= length) {
    const chunk = await model.findAll({ ...options, limit: chunkSize, offset });
    yield* chunk as M[];
    ({ length } = chunk);
    offset += length;
  }
}
