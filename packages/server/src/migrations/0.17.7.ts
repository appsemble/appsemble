import { logger } from '@appsemble/node-utils';
import { hash } from 'bcrypt';
import { QueryTypes, Sequelize } from 'sequelize';

export const key = '0.17.7';

/**
 * Summary:
 * - Hash all OAuth2 client secrets.
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const credentials = await db.query<{ secret: string }>(
    'SELECT secret from "OAuth2ClientCredentials"',
    { raw: true, type: QueryTypes.SELECT },
  );

  logger.info(`Hashing ${credentials.length} OAuth2 client credentials`);
  await Promise.all(
    credentials.map(async ({ secret }) =>
      db.query('UPDATE "OAuth2ClientCredentials" SET secret = ? WHERE secret = ?', {
        logging: false,
        replacements: [await hash(secret, 10), secret],
      }),
    ),
  );
}

/**
 * Summary:
 * - Remove all OAuth2ClientCredentials
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.warn('Deleting all OAuth2 client credentials');
  await queryInterface.bulkDelete('OAuth2ClientCredentials', {});
}
