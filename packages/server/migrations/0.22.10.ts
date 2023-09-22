import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';

export const key = '0.22.10';

/**
 * Summary:
 * - Sets `examples` value to empty array for block versions where `examples` is null.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  logger.info(
    'Setting `examples` value to empty array for block versions where `examples` is null.',
  );
  await db.query(
    `
    UPDATE "BlockVersion"
    SET examples = '[]'
    WHERE "examples" IS NULL
    `,
  );
}

export function down(): void {
  logger.info('Down migration is empty!');
}
