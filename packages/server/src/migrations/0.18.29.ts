import { logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';

export const key = '0.18.29';

/**
 * Summary:
 * - Add columns `consent`, `password`, `emailKey`, and `resetKey` to AppMember
 * - Migrate data into consent column
 * - Remove OAuth2Consent table
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Adding column `consent` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'consent', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  logger.info('Migrating existing consent');
  await db.query(
    'UPDATE "AppMember" m SET consent = c.created FROM "OAuth2Consent" c WHERE c."AppId" = m."AppId" AND c."UserId" = m."UserId";',
    { type: QueryTypes.UPDATE },
  );

  logger.info('Removing table `OAuth2Consent');
  await queryInterface.dropTable('OAuth2Consent');

  logger.info('Adding column `password` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'password', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column `emailKey` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'emailKey', {
    type: DataTypes.STRING,
  });
  logger.info('Adding column `resetKey` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'resetKey', {
    type: DataTypes.STRING,
  });

  logger.info('Adding unique index between columns `AppId` and `email` for `AppMember`');
  await queryInterface.addConstraint('AppMember', {
    name: 'UniqueAppMemberEmailIndex',
    fields: ['AppId', 'email'],
    type: 'unique',
  });
}

/**
 * Summary:
 * - Create OAuth2Consent table
 * - Migrate consent data from AppMember
 * - Remove columns `consent`, `password`, `resetKey`, and `emailKey` from AppMember
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Creating table `OAuth2Consent');
  await queryInterface.createTable('OAuth2Consent', {
    AppId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      allowNull: false,
      references: { model: 'App', key: 'id' },
    },
    UserId: {
      type: DataTypes.UUID,
      primaryKey: true,
      onDelete: 'cascade',
      onUpdate: 'cascade',
      allowNull: false,
      references: { model: 'User', key: 'id' },
    },
    scope: { type: DataTypes.STRING, allowNull: false },
    created: { type: DataTypes.DATE, allowNull: false },
    updated: { type: DataTypes.DATE, allowNull: false },
  });

  logger.info('Migrating consent from `AppMember` to `OAuth2Consent');
  const consent = await db.query<{ AppId: number; UserId: string; consent: Date }>(
    'SELECT "AppId", "UserId", consent FROM "AppMember" WHERE consent IS NOT NULL;',
    { type: QueryTypes.SELECT },
  );
  await Promise.all(
    consent.map((entry) =>
      db.query('INSERT INTO "OAuth2Consent" VALUES (?, ?, ?, ?, ?)', {
        replacements: [entry.AppId, entry.UserId, 'openid', entry.consent, entry.consent],
      }),
    ),
  );

  logger.info('Removing column `consent` from `AppMember`');
  await queryInterface.removeColumn('AppMember', 'consent');

  logger.info('Removing column `password` from `AppMember`');
  await queryInterface.removeColumn('AppMember', 'password');

  logger.info('Removing column `resetKey` from `AppMember`');
  await queryInterface.removeColumn('AppMember', 'resetKey');

  logger.info('Removing column `emailKey` from `AppMember`');
  await queryInterface.removeColumn('AppMember', 'emailKey');
}
