import { logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';
import { v4 } from 'uuid';

export const key = '0.18.28';

/**
 * Summary:
 * - Add columns `id`, `email`, `emailVerified`, `name, `password` to table `AppMember`
 * - Update column `UserId` to `AppMemberId` in tables `AppSamlAuthorization`
 * and `AppOAuth2Authorization`, referring to `AppMember` through `AppMember.UserId`
 * - Copy over `User` information into `AppMember` and generate IDs.
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Adding column `name` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'name', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column `email` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'email', {
    type: DataTypes.STRING,
  });

  logger.info('Adding column `emailVerified` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'emailVerified', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  });

  logger.info('Removing foreign key constraints from table `AppSamlAuthorization`');
  await queryInterface.removeConstraint('AppSamlAuthorization', 'AppSamlAuthorization_UserId_fkey');

  logger.info('Renaming column `UserId` to `AppMemberId` for table `AppSamlAuthorization`');
  await queryInterface.renameColumn('AppSamlAuthorization', 'UserId', 'AppMemberId');

  logger.info('Removing foreign key constraints from table `AppOAuth2Authorization`');
  await queryInterface.removeConstraint(
    'AppOAuth2Authorization',
    'AppOAuth2Authorization_UserId_fkey',
  );

  logger.info('Renaming column `UserId` to `AppMemberId` for table `AppOAuth2Authorization`');
  await queryInterface.renameColumn('AppOAuth2Authorization', 'UserId', 'AppMemberId');

  logger.info(
    'Adding unique constraint `UniqueAppMemberIndex` to fields `AppId` and `UserId` in table `AppMember`',
  );
  await queryInterface.addConstraint('AppMember', {
    name: 'UniqueAppMemberIndex',
    fields: ['AppId', 'UserId'],
    type: 'unique',
  });

  logger.info('Adding field `id` to `AppMember`');
  await queryInterface.addColumn('AppMember', 'id', {
    type: DataTypes.UUID,
    allowNull: true,
  });

  const [samlUsers, oauthUsers, existingAppMembers] = await Promise.all([
    db.query<{ AppMemberId: string }>('SELECT "AppMemberId" FROM "AppSamlAuthorization"', {
      type: QueryTypes.SELECT,
    }),
    db.query<{ AppMemberId: string }>('SELECT "AppMemberId" FROM "AppOAuth2Authorization"', {
      type: QueryTypes.SELECT,
    }),
    db.query<{ UserId: string }>('SELECT "UserId" FROM "AppMember"', {
      type: QueryTypes.SELECT,
    }),
  ]);

  const users = await db.query<{
    id: string;
    name: string;
    primaryEmail: string;
    verified: boolean;
    newId?: string;
  }>(
    'SELECT u.id, u.name, u."primaryEmail", e.verified FROM "User" u LEFT OUTER JOIN "EmailAuthorization" e ON u."primaryEmail" = e.email WHERE u.id IN (?);',
    {
      type: QueryTypes.SELECT,
      replacements: [
        [
          ...samlUsers.map((user) => user.AppMemberId),
          ...oauthUsers.map((user) => user.AppMemberId),
          ...existingAppMembers.map((user) => user.UserId),
        ],
      ],
    },
  );

  logger.info('Updating AppMember name, email, and emailVerified');
  await Promise.all(
    users.map((user) =>
      db.query(
        'UPDATE "AppMember" SET name = ?, email = ?, "emailVerified" = ? WHERE "UserId" = ?',
        {
          replacements: [user.name, user.primaryEmail, user.verified, user.id],
          type: QueryTypes.UPDATE,
        },
      ),
    ),
  );

  const appMembers = await db.query<{ AppId: number; UserId: string }>(
    'SELECT "AppId", "UserId" FROM "AppMember";',
    { type: QueryTypes.SELECT },
  );

  logger.info('Generating IDs for `AppMember.id`');
  await Promise.all(
    appMembers.map((appMember) =>
      db.query('UPDATE "AppMember" SET id = ? WHERE "AppId" = ? AND "UserId" = ?', {
        type: QueryTypes.UPDATE,
        replacements: [v4(), appMember.AppId, appMember.UserId],
      }),
    ),
  );

  logger.info('Removing `AppMember` primary key');
  await queryInterface.removeConstraint('AppMember', 'AppMember_pkey');

  logger.info('Updating `AppMember` `id` to be primary key and non-nullable');
  await queryInterface.changeColumn('AppMember', 'id', {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  });
  await queryInterface.addConstraint('AppMember', {
    fields: ['id'],
    type: 'primary key',
    name: 'AppMember_pkey',
  });

  logger.info(
    'Adding constraint `AppSamlAuthorization_UserId_fkey` to table `AppSamlAuthorization`',
  );
  await queryInterface.addConstraint('AppSamlAuthorization', {
    name: 'AppSamlAuthorization_AppMemberId_fkey',
    type: 'foreign key',
    fields: ['AppMemberId'],
    onUpdate: 'cascade',
    onDelete: 'cascade',
    references: {
      table: 'AppMember',
      field: 'id',
    },
  });

  logger.info(
    'Adding constraint `AppOAuth2Authorization_UserId_fkey` to table `AppOAuth2Authorization`',
  );
  await queryInterface.addConstraint('AppOAuth2Authorization', {
    type: 'foreign key',
    fields: ['AppMemberId'],
    onUpdate: 'cascade',
    onDelete: 'cascade',
    references: {
      table: 'AppMember',
      field: 'id',
    },
  });
}

/**
 */
export function down(): void {
  logger.info('Not implemented yet');
}
