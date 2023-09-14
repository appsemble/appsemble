import { logger } from '@appsemble/node-utils';
import { type Sequelize } from 'sequelize';

export const key = '0.22.9';

/**
 * Summary:
 * - Sets `scimActive` to null for non-SCIM users
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  logger.info('Setting `scimActive` value to null for non-SCIM users');
  await db.query(
    `
    UPDATE "AppMember"
    SET "scimActive" = null
    WHERE "scimActive" IS NOT NULL AND "scimExternalId" IS NULL
    `,
  );
}

export function down(): void {
  logger.info('Down migration is empty!');
}
