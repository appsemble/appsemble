import { DataTypes, type Sequelize } from 'sequelize';

export const key = '0.13.1';

/**
 * Summary:
 * - Rename id to sub
 * - Rename token to accessToken
 * - Rename provider to authorizationUrl
 * - Add `longDescription` column to `BlockVersion`.
 *
 * Data hasn’t been migrated, because there is no data in this table in production. The table is
 * wiped, just to be sure.
 *
 * @param db The sequelize Database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  await queryInterface.bulkDelete('OAuthAuthorization', {});
  await queryInterface.renameColumn('OAuthAuthorization', 'id', 'sub');
  await queryInterface.renameColumn('OAuthAuthorization', 'token', 'accessToken');
  await queryInterface.renameColumn('OAuthAuthorization', 'provider', 'authorizationUrl');
  await queryInterface.addColumn('BlockVersion', 'longDescription', { type: DataTypes.TEXT });
}

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  await queryInterface.bulkDelete('OAuthAuthorization', {});
  await queryInterface.renameColumn('OAuthAuthorization', 'sub', 'id');
  await queryInterface.renameColumn('OAuthAuthorization', 'accessToken', 'token');
  await queryInterface.renameColumn('OAuthAuthorization', 'authorizationUrl', 'provider');
  await queryInterface.removeColumn('BlockVersion', 'longDescription');
}
