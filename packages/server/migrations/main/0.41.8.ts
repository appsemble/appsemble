import { logger } from '@appsemble/node-utils';
import { DataTypes, QueryTypes, type Sequelize, type Transaction } from 'sequelize';

import { closeAppDB, getAppDB } from '../../models/index.js';

export const key = '0.41.8';

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();
  logger.info('Add table `UserAppAccount`');
  await queryInterface.createTable(
    'UserAppAccount',
    {
      UserId: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        references: { model: 'User', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      AppId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'App', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created: { type: DataTypes.DATE, allowNull: false },
      updated: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  logger.info('Record the app member accounts of users from each app database');
  const apps = await db.query<{ id: number }>('SELECT "id" FROM "App" ORDER BY "id"', {
    type: QueryTypes.SELECT,
    transaction,
  });
  for (const { id } of apps) {
    const { sequelize: appDB } = await getAppDB(id, db, transaction);
    const members = await appDB.query<{ userId: string }>(
      'SELECT "userId" FROM "AppMember" WHERE "userId" IS NOT NULL',
      { type: QueryTypes.SELECT },
    );
    await closeAppDB(id);
    await db.query(
      `INSERT INTO "UserAppAccount" ("UserId", "AppId", "created", "updated")
       SELECT "id", :appId, NOW(), NOW() FROM "User" WHERE "id" = ANY(ARRAY[:userIds]::uuid[])`,
      {
        replacements: { appId: id, userIds: members.map(({ userId }) => userId) },
        transaction,
      },
    );
  }
}

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  logger.info('Remove table `UserAppAccount`');
  await db.getQueryInterface().dropTable('UserAppAccount', { transaction });
}
