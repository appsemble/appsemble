import { logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, type Sequelize } from 'sequelize';

import { convertUserToAppMember } from './utils.js';

export const key = '0.23.1';

/**
 * Summary:
 * - Replaces Users in Resources (AuthorId and EditorId) with AppMembers
 * - Replaces UserId with AppMemberId in ResourceVersion
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  // ### Resource
  interface DatabaseResource {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    User_AuthorId: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    User_EditorId: string;
    AppId: number;
  }

  logger.info('Renaming column `Resource`.AuthorId to User_AuthorId');
  await queryInterface.removeConstraint('Resource', 'Resource_AuthorId_fkey');
  await queryInterface.renameColumn('Resource', 'AuthorId', 'User_AuthorId');

  logger.info('Renaming column `Resource`.EditorId to User_EditorId');
  await queryInterface.removeConstraint('Resource', 'Resource_EditorId_fkey');
  await queryInterface.renameColumn('Resource', 'EditorId', 'User_EditorId');

  const resources: DatabaseResource[] = (
    await db.query(`
      SELECT "User_AuthorId", "User_EditorId", "AppId"
      FROM "Resource"
    `)
  )[0] as DatabaseResource[];

  logger.info('Adding column `AuthorId` to Resource');
  await queryInterface.addColumn('Resource', 'AuthorId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'AppMember',
      key: 'id',
    },
  });

  logger.info('Adding column `EditorId` to `Resource`');
  await queryInterface.addColumn('Resource', 'EditorId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'AppMember',
      key: 'id',
    },
  });

  logger.info("Add associated AppMemberId's to `Resource`.`AppMemberId`");
  let resourceError = false;
  for (const resource of resources) {
    try {
      const newAuthor = await convertUserToAppMember(db, resource.AppId, resource.User_AuthorId);
      if (newAuthor) {
        await db.query('UPDATE "Resource" SET "AuthorId" = ? WHERE "User_AuthorId" = ?', {
          type: QueryTypes.UPDATE,
          replacements: [newAuthor, resource.User_AuthorId],
        });
      }

      const newEditor = await convertUserToAppMember(db, resource.AppId, resource.User_EditorId);
      if (newEditor) {
        await db.query('UPDATE "Resource" SET "EditorId" = ? WHERE "User_EditorId" = ?', {
          type: QueryTypes.UPDATE,
          replacements: [newEditor, resource.User_EditorId],
        });
      }
    } catch (error) {
      logger.error(error);
      resourceError = true;
      continue;
    }
  }

  if (resourceError) {
    logger.warn(
      'A problem occurred while migrating Resource Users to AppMembers. Old data not deleted in this migration. See log for more information.',
    );
  } else {
    logger.warn('Removing columns `User_AuthorId` and `User_EditorId` from `Resource`');
    await queryInterface.removeColumn('Resource', 'User_AuthorId');
    await queryInterface.removeColumn('Resource', 'User_EditorId');
  }

  // ### Resource version
  interface OldResourceVersion {
    UserId: string;
    ResourceId: string;
    AppId: number;
  }

  const resourceVersions: OldResourceVersion[] = (
    await db.query(`
      SELECT rv."UserId", rv."ResourceId", r."AppId"
      FROM "ResourceVersion" rv
      RIGHT JOIN "Resource" r ON r.id = rv."ResourceId"
    `)
  )[0] as OldResourceVersion[];

  logger.info('Adding column `AppMemberId` to `ResourceVersion`');
  await queryInterface.addColumn('ResourceVersion', 'AppMemberId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'AppMember',
      key: 'id',
    },
  });

  logger.info("Add associated AppMemberId's to `ResourceVersion`.`AppMemberId`");
  let resourceVersionError = false;
  for (const resourceVersion of resourceVersions) {
    try {
      const appMember = await convertUserToAppMember(
        db,
        resourceVersion.AppId,
        resourceVersion.UserId,
      );
      if (appMember) {
        await db.query('UPDATE "ResourceVersion" SET "AppMemberId" = ? WHERE "UserId" = ?', {
          type: QueryTypes.UPDATE,
          replacements: [appMember, resourceVersion.UserId],
        });
      }
    } catch (error) {
      logger.error(error);
      resourceVersionError = true;
      continue;
    }
  }

  if (resourceVersionError) {
    logger.warn(
      'A problem occurred while migrating ResourceVersion Users to AppMembers. Old data not deleted in this migration. See log for more information.',
    );
  } else {
    await queryInterface.changeColumn('ResourceVersion', 'AppMemberId', {
      type: DataTypes.UUID,
      allowNull: false,
    });

    logger.warn('Removing column `UserId` from ResourceVersion');
    await queryInterface.removeConstraint('ResourceVersion', 'ResourceVersion_UserId_fkey');
    await queryInterface.removeColumn('ResourceVersion', 'UserId');
  }
}

/**
 * Summary:
 * - Replaces AppMembers in Resources (AuthorId and EditorId) with Users
 * - Replaces AppMemberId with UserId in ResourceVersion
 *
 * @param db The sequelize database.
 */

export async function down(db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  // ### Resource
  interface DatabaseResource {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    AppMember_AuthorId: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    AppMember_EditorId: string;
    AuthorUser: string;
    EditorUser: string;
  }

  logger.info('Renaming column `Resource`.AuthorId to AppMember_AuthorId');
  await queryInterface.removeConstraint('Resource', 'Resource_AuthorId_fkey');
  await queryInterface.renameColumn('Resource', 'AuthorId', 'AppMember_AuthorId');

  logger.info('Renaming column `Resource`.EditorId to AppMember_EditorId');
  await queryInterface.removeConstraint('Resource', 'Resource_EditorId_fkey');
  await queryInterface.renameColumn('Resource', 'EditorId', 'AppMember_EditorId');

  const resources: DatabaseResource[] = (
    await db.query(`
      SELECT
        r."AppMember_AuthorId",
        r."AppMember_EditorId",
        author."UserId" as "AuthorUser",
        editor."UserId" as "EditorUser"
      FROM "Resource" r
      RIGHT JOIN "AppMember" author ON author.id = r."AppMember_AuthorId"
      RIGHT JOIN "AppMember" editor ON editor.id = r."AppMember_EditorId"
    `)
  )[0] as DatabaseResource[];

  logger.info('Adding column `AuthorId` to Resource');
  await queryInterface.addColumn('Resource', 'AuthorId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'User',
      key: 'id',
    },
  });

  logger.info('Adding column `EditorId` to `Resource`');
  await queryInterface.addColumn('Resource', 'EditorId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'User',
      key: 'id',
    },
  });

  let resourceError = false;
  for (const resource of resources) {
    try {
      await db.query('UPDATE "Resource" SET "AuthorId" = ? WHERE "AppMember_AuthorId" = ?', {
        type: QueryTypes.UPDATE,
        replacements: [resource.AuthorUser, resource.AppMember_AuthorId],
      });

      await db.query('UPDATE "Resource" SET "EditorId" = ? WHERE "AppMember_EditorId" = ?', {
        type: QueryTypes.UPDATE,
        replacements: [resource.EditorUser, resource.AppMember_EditorId],
      });
    } catch (error) {
      logger.error(error);
      resourceError = true;
      continue;
    }
  }

  if (resourceError) {
    logger.warn(
      'A problem occurred while migrating Resource Users to AppMembers. Old data not deleted in this migration. See log for more information.',
    );
  } else {
    logger.warn('Removing columns `AppMember_AuthorId` and `AppMember_EditorId` from `Resource`');
    await queryInterface.removeColumn('Resource', 'AppMember_AuthorId');
    await queryInterface.removeColumn('Resource', 'AppMember_EditorId');
  }

  // ### ResourceVersion
  interface OldResourceVersion {
    AppMemberId: string;
    ResourceId: string;
    AppId: string;
    MemberUserId: string;
  }

  const resourceVersions: OldResourceVersion[] = (
    await db.query(`
      SELECT rv."AppMemberId", rv."ResourceId", r."AppId", am."UserId" AS "MemberUserId"
      FROM "ResourceVersion" rv
      RIGHT JOIN "Resource" r ON r.id = rv."ResourceId"
      RIGHT JOIN "AppMember" am ON am.id = rv."AppMemberId"
      `)
  )[0] as OldResourceVersion[];

  logger.info('Adding column `UserId` to `ResourceVersion`');
  await queryInterface.addColumn('ResourceVersion', 'UserId', {
    type: DataTypes.UUID,
    onDelete: 'cascade',
    onUpdate: 'cascade',
    references: {
      model: 'User',
      key: 'id',
    },
  });

  logger.info("Add associated UserId's to `ResourceVersion`.`UserId`");
  let resourceVersionError = false;
  for (const resourceVersion of resourceVersions) {
    try {
      await db.query('UPDATE "ResourceVersion" SET "UserId" = ? WHERE "AppMemberId" = ?', {
        type: QueryTypes.UPDATE,
        replacements: [resourceVersion.MemberUserId, resourceVersion.AppMemberId],
      });
    } catch (error) {
      logger.error(error);
      resourceVersionError = true;
      continue;
    }
  }

  if (resourceVersionError) {
    logger.warn(
      'A problem occurred while migrating ResourceVersion AppMembers to Users. Old data not deleted in this migration. See log for more information.',
    );
  } else {
    logger.warn('Removing column `AppMemberId` from ResourceVersion');
    await queryInterface.removeConstraint('ResourceVersion', 'ResourceVersion_AppMemberId_fkey');
    await queryInterface.removeColumn('ResourceVersion', 'AppMemberId');
  }
}
