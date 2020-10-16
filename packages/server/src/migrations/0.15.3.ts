import { logger } from '@appsemble/node-utils';
import type { Sequelize } from 'sequelize';

export const key = '0.15.3';

/**
 * Symmary:
 * - Set the primary keys in the `OAuth2Consent` table.
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding primary key to table OAuth2Consent');
  await queryInterface.addConstraint('OAuth2Consent', {
    type: 'primary key',
    name: 'OAuth2Consent_pkey',
    fields: ['AppId', 'UserId'],
  });
}

/**
 * Symmary:
 * - Drop the primary key constraint in the `OAuth2Consent` table.
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Removing primary key from table OAuth2Consent');
  await queryInterface.removeConstraint('OAuth2Consent', 'OAuth2Consent_pkey');
}
