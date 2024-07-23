import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.30.0';

/**
 * Summary:
 * - TODO: Cleanup duplicate users with same email
 * - TODO: Cleanup anonymous users with only a timezone (and name)
 * - TODO: Cleanup demo login users
 * - Add column `id` to `TeamMember` table
 * - Making `AppMember.UserId` nullable
 * - Add unique index `UniqueUserEmail` to column `primaryEmail` on `User` table
 * - TODO: Remove column `UserId` from table `OAuth2AuthorizationCode`
 * - TODO: Add column `AppMemberId` to the `OAuth2AuthorizationCode` table with foreign key
 * constraint
 * - Change column `AppMemberId` to nullable on table `AppOAuth2Authorization`
 * - Remove column `demoLoginUser` from `User` table
 * - Add column `timezone` to the `AppMember` table
 * - Add column `demo` to the `AppMember` table
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  // TODO: make sure to delete duplicate users with same email
  // TODO: make sure to delete users with only a timezone (and name)
  // TODO: cleanup demoLoginUsers

  logger.info('Add column `id` to `TeamMember` table');
  await queryInterface.addColumn(
    'TeamMember',
    'id',
    {
      allowNull: false,
      type: DataTypes.UUID,
      primaryKey: true,
    },
    { transaction },
  );

  // Logger.info('Removing primary key from `TeamMember` table');
  // await queryInterface.removeConstraint('TeamMember', 'TeamMember_pkey', { transaction });

  // logger.info(
  //   'Creating composite primary key on `TeamMember` table for `id`, `TeamId`, `AppMemberId`',
  // );
  // await queryInterface.addConstraint('TeamMember', {
  //   fields: ['id', 'TeamId', 'AppMemberId'],
  //   type: 'primary key',
  //   name: 'TeamMember_pkey',
  //   transaction,
  // });

  logger.info('Making `AppMember.UserId` nullable');
  await queryInterface.changeColumn(
    'AppMember',
    'UserId',
    {
      allowNull: true,
      type: DataTypes.UUID,
    },
    { transaction },
  );

  logger.warn('Add unique index `UniqueUserEmail` to `primaryEmail` column on `User` table');
  logger.warn('');
  await queryInterface.addIndex('User', ['primaryEmail'], {
    unique: true,
    name: 'UniqueUserEmail',
    transaction,
  });

  // TODO: handle existing connections
  logger.info('Remove column `UserId` on `OAuth2AuthorizationCode` table');
  await queryInterface.removeColumn('OAuth2AuthorizationCode', 'UserId', { transaction });
  // TODO: handle existing connections
  logger.info('Add column `AppMemberId` to `OAuth2AuthorizationCode` table');
  await queryInterface.addColumn(
    'OAuth2AuthorizationCode',
    'AppMemberId',
    {
      type: DataTypes.UUID,
      allowNull: true,
      onUpdate: 'cascade',
      onDelete: 'cascade',
      references: {
        key: 'id',
        model: 'AppMember',
      },
    },
    { transaction },
  );

  logger.info('Change column `AppMemberId` to nullable on `AppOAuth2Authorization` table');
  await queryInterface.changeColumn(
    'AppOAuth2Authorization',
    'AppMemberId',
    {
      type: DataTypes.UUID,
      allowNull: true,
      onUpdate: 'cascade',
      onDelete: 'cascade',
      // TODO: fix the following creating new fkeys every time
      // references: {
      //   key: 'id',
      //   model: 'AppMember',
      // },
    },
    { transaction },
  );

  logger.info('Remove column `demoLoginUser` from `User` table');
  await queryInterface.removeColumn('User', 'demoLoginUser', { transaction });

  logger.info('Add column `timezone` to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'timezone',
    {
      type: DataTypes.STRING,
      allowNull: true,
    },
    { transaction },
  );

  logger.info('Add column `demo` to `AppMember` table');
  await queryInterface.addColumn(
    'AppMember',
    'demo',
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    { transaction },
  );
}

/**
 * Summary:
 * - Remove column `id` from `TeamMember` table
 * - Making `AppMember.UserId` non-nullable
 * - Remove unique index `UniqueUserEmail` from column `primaryEmail` on `User` table
 * - TODO: Remove column `AppMemberId` on `OAuth2AuthorizationCode` table
 * - TODO: Add column `UserId` to table `OAuth2AuthorizationCode` with foreign key constraint
 * - Change column `AppMemberId` to non-nullable on table `AppOAuth2Authorization`
 * - Add column `demoLoginUser` to `User` table
 * - Remove column `timezone` from the `AppMember` table
 * - Remove column `demo` from the `AppMember` table
 *
 * @param transaction The sequelize transaction.
 * @param db The sequelize database.
 */
export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Remove column `id` from `TeamMember` table');
  await queryInterface.removeColumn('TeamMember', 'id', { transaction });

  logger.warn('Making `AppMember.UserId` non-nullable');
  logger.warn('');
  await queryInterface.changeColumn(
    'AppMember',
    'UserId',
    {
      allowNull: false,
      type: DataTypes.UUID,
    },
    { transaction },
  );

  logger.info('Remove unique index `UniqueUserEmail` from `primaryEmail` column on `User` table');
  await queryInterface.removeIndex('User', 'UniqueUserEmail', { transaction });

  // TODO: handle existing connections
  logger.info('Remove column `AppMemberId` on `OAuth2AuthorizationCode` table');
  await queryInterface.removeColumn('OAuth2AuthorizationCode', 'AppMemberId', { transaction });
  // TODO: handle existing connections
  logger.warn('Add column `UserId` to `OAuth2AuthorizationCode` table with foreign key constraint');
  logger.warn('');
  await queryInterface.addColumn(
    'OAuth2AuthorizationCode',
    'UserId',
    {
      type: DataTypes.UUID,
      allowNull: false,
      onUpdate: 'cascade',
      onDelete: 'cascade',
      references: {
        key: 'id',
        model: 'User',
      },
    },
    { transaction },
  );

  logger.warn('Change column `AppMemberId` to non-nullable on `AppOAuth2Authorization` table');
  logger.warn('');
  await queryInterface.changeColumn(
    'AppOAuth2Authorization',
    'AppMemberId',
    {
      type: DataTypes.UUID,
      allowNull: false,
      onUpdate: 'cascade',
      onDelete: 'cascade',
      // References: {
      //   key: 'id',
      //   model: 'AppMember',
      // },
    },
    { transaction },
  );

  logger.info('Add column `demoLoginUser` to `User` table');
  await queryInterface.addColumn(
    'User',
    'demoLoginUser',
    { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    { transaction },
  );

  logger.info('Remove column `timezone` on `AppMember` table');
  await queryInterface.removeColumn('AppMember', 'timezone', { transaction });

  logger.info('Remove column `demo` on `AppMember` table');
  await queryInterface.removeColumn('AppMember', 'demo', { transaction });
}
