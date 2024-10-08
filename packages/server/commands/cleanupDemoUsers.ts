import { logger } from '@appsemble/node-utils';
import { Op } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { AppMember, GroupMember, initDB, Resource, transactional, User } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'cleanup-demo-users';
export const description = 'Deletes all demo users from the database.';

export function builder(yargs: Argv): Argv {
  return databaseBuilder(yargs);
}

export async function handler(): Promise<void> {
  let db;

  try {
    db = initDB({
      host: argv.databaseHost,
      port: argv.databasePort,
      username: argv.databaseUser,
      password: argv.databasePassword,
      database: argv.databaseName,
      ssl: argv.databaseSsl,
      uri: argv.databaseUrl,
    });
  } catch (error: unknown) {
    handleDBError(error as Error);
  }

  logger.info('Cleaning up all demo users');

  await transactional(async () => {
    const userIdsToDelete = await User.findAll({
      attributes: ['id', 'demoLoginUser'],
      where: {
        demoLoginUser: true,
      },
    }).then((users) => users.map((user) => user.id));

    const appMemberIdsToDelete = await AppMember.findAll({
      attributes: ['id'],
      where: {
        UserId: { [Op.in]: userIdsToDelete },
      },
    }).then((appMembers) => appMembers.map((appMember) => appMember.id));

    const groupMembersDestroyed = await GroupMember.destroy({
      where: {
        AppMemberId: { [Op.in]: appMemberIdsToDelete },
      },
    });
    logger.info(`Removed ${groupMembersDestroyed} demo group members.`);

    const appMembersDestroyed = await AppMember.destroy({
      where: {
        UserId: { [Op.in]: userIdsToDelete },
      },
    });
    logger.info(`Removed ${appMembersDestroyed} demo app members.`);

    const resourcesDestroyed = await Resource.destroy({
      where: {
        AuthorId: { [Op.in]: userIdsToDelete },
      },
    });
    logger.info(`Removed ${resourcesDestroyed} demo resources.`);

    const usersDestroyed = await User.destroy({
      where: { demoLoginUser: true },
    });
    logger.info(`Removed ${usersDestroyed} demo users.`);
  });

  await db.close();
}
