import { logger } from '@appsemble/node-utils';
import { DataTypes, type Sequelize, type Transaction } from 'sequelize';

export const key = '0.41.0';

const defaultLanguage =
  "lower(replace(coalesce(a.definition->>'defaultLanguage', 'en'), '_', '-'))";

/**
 * Summary:
 * - Move column `passwordMessage` of table `App` to the default language in table `AppMessages`
 */

export async function up(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add `AppMessages` for the default language of apps with a password page message');
  await db.query(
    `INSERT INTO "AppMessages" ("AppId", language, messages, created, updated)
     SELECT a.id, ${defaultLanguage}, '{}', NOW(), NOW()
     FROM "App" a
     WHERE a."passwordMessage" IS NOT NULL
     ON CONFLICT ("AppId", language) DO NOTHING`,
    { transaction },
  );

  logger.info('Move column `passwordMessage` of table `App` to `AppMessages`');
  await db.query(
    `UPDATE "AppMessages" m
     SET messages = jsonb_set(
       jsonb_set(
         coalesce(m.messages::jsonb, '{}'),
         '{core}',
         coalesce(m.messages::jsonb->'core', '{}')
       ),
       '{core,server.passwordPage.message}',
       to_jsonb(a."passwordMessage")
     )::json,
     updated = NOW()
     FROM "App" a
     WHERE m."AppId" = a.id
       AND m.language = ${defaultLanguage}
       AND a."passwordMessage" IS NOT NULL`,
    { transaction },
  );

  logger.info('Remove column `passwordMessage` from table `App`');
  await queryInterface.removeColumn('App', 'passwordMessage', { transaction });
}

/**
 * Summary:
 * - Move the password page message of the default language to column `passwordMessage` of `App`
 * - Remove the `server.passwordPage.message` core message from table `AppMessages`
 */

export async function down(transaction: Transaction, db: Sequelize): Promise<void> {
  const queryInterface = db.getQueryInterface();

  logger.info('Add column `passwordMessage` to table `App`');
  await queryInterface.addColumn(
    'App',
    'passwordMessage',
    { type: DataTypes.TEXT },
    { transaction },
  );

  logger.info('Move the password page message of the default language to table `App`');
  await db.query(
    `UPDATE "App" a
     SET "passwordMessage" = m.messages->'core'->>'server.passwordPage.message'
     FROM "AppMessages" m
     WHERE m."AppId" = a.id
       AND m.language = ${defaultLanguage}`,
    { transaction },
  );

  logger.info('Remove the password page message from table `AppMessages`');
  await db.query(
    `UPDATE "AppMessages"
     SET messages = (messages::jsonb #- '{core,server.passwordPage.message}')::json
     WHERE messages->'core'->'server.passwordPage.message' IS NOT NULL`,
    { transaction },
  );
}
