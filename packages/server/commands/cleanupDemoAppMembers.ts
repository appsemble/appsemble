import { logger } from '@appsemble/node-utils';
import { Op } from 'sequelize';
import { type Argv } from 'yargs';

import { databaseBuilder } from './builder/database.js';
import { App, getAppDB, initDB } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { handleDBError } from '../utils/sqlUtils.js';

export const command = 'cleanup-demo-app-members';
export const description = 'Deletes all demo app members from the database.';

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

  const apps = await App.findAll({ attributes: ['id'] });
  await Promise.all(
    apps.map(async (app) => {
      const { AppMember, GroupMember, Resource, sequelize } = await getAppDB(app.id);
      await sequelize.transaction(async (transaction) => {
        const appMemberIdsToDelete = await AppMember.findAll({
          attributes: ['id', 'demo'],
          where: { demo: true },
        }).then((appMembers) => appMembers.map((appMember) => appMember.id));

        const groupMembersDestroyed = await GroupMember.destroy({
          where: { AppMemberId: { [Op.in]: appMemberIdsToDelete } },
          transaction,
        });
        logger.info(`Removed ${groupMembersDestroyed} demo group members from app ${app.id}.`);

        const resourcesDestroyed = await Resource.destroy({
          where: { AuthorId: { [Op.in]: appMemberIdsToDelete } },
          force: true,
          transaction,
        });
        logger.info(`Removed ${resourcesDestroyed} demo resources from app ${app.id}.`);

        const appMembersDestroyed = await AppMember.destroy({
          where: { demo: true },
          transaction,
        });
        logger.info(`Removed ${appMembersDestroyed} demo app members from app ${app.id}.`);
      });
      await sequelize.close();
    }),
  );

  await db.close();
  process.exit();
}
