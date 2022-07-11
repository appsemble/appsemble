import { logger } from '@appsemble/node-utils';
import { QueryTypes, Sequelize } from 'sequelize';

export const key = '0.18.11';

interface NewMessages {
  core: Record<string, string>;
  app: Record<string, string>;
  messageIds: Record<string, string>;
  blocks: Record<string, Record<string, Record<string, string>>>;
}

/**
 * Summary:
 * - Add enum options "APIUser", "APIReader", "Translator"
 * - Migrate all app messages to use the new format.
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  logger.info('Adding enum value "APIUser" to "enum_Member_role"');
  await db.query("ALTER TYPE \"enum_Member_role\" ADD VALUE 'APIUser' AFTER 'Member'");

  logger.info('Adding enum value "APIReader" to "enum_Member_role"');
  await db.query("ALTER TYPE \"enum_Member_role\" ADD VALUE 'APIReader' AFTER 'Member'");

  logger.info('Adding enum value "Translator" to "enum_Member_role"');
  await db.query("ALTER TYPE \"enum_Member_role\" ADD VALUE 'Translator' AFTER 'Member'");

  const appMessages = await db.query<{
    AppId: number;
    language: string;
    messages: Record<string, string>;
  }>('SELECT "AppId", language, messages FROM "AppMessages" WHERE messages -> \'core\' IS NULL', {
    type: QueryTypes.SELECT,
  });
  for (const record of appMessages) {
    const keys = Object.entries(record.messages);
    const newMessages: NewMessages = { core: {}, app: {}, blocks: {}, messageIds: {} };

    for (const [id, value] of keys) {
      if (id.startsWith('pages.')) {
        newMessages.app[id] = value;
      } else if (id.startsWith('@')) {
        const [org, blockName, version, messageId] = id.split('/');
        const type = `${org}/${blockName}`;
        if (!newMessages.blocks[type]) {
          newMessages.blocks[type] = { [version]: { [messageId]: value } };
          // eslint-disable-next-line no-negated-condition
        } else if (!newMessages.blocks[type][version]) {
          newMessages.blocks[type][version] = { [messageId]: value };
        } else {
          newMessages.blocks[type][version][messageId] = value;
        }
      } else if (id.startsWith('app.src.') || id.startsWith('react-components.src.')) {
        newMessages.core[id] = value;
      } else {
        newMessages.messageIds[id] = value;
      }
    }

    logger.info(`Updating messages for AppId ${record.AppId}, language ${record.language}`);
    await db.query('UPDATE "AppMessages" SET messages = ? WHERE "AppId" = ? AND language = ?', {
      replacements: [JSON.stringify(newMessages), record.AppId, record.language],
      type: QueryTypes.UPDATE,
    });
  }
}

/**
 * Summary:
 * - Remove enum options "APIUser", "APIReader", "Translator"
 * - Migrate all app messages to use the old format.
 *
 * @param db The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  logger.info('Setting role of all APIUsers, APIReaders, and Translators to Member');
  await db.query(
    "UPDATE \"Member\" SET role = 'Member' WHERE role IN ('APIUser', 'APIReader', 'Translator')",
  );

  logger.info('Removing enum value "APIUser" from "enum_Member_role"');
  await db.query("ALTER TYPE \"enum_Member_role\" ADD VALUE 'APIUser' AFTER 'member'");

  logger.info('Removing enum value "APIReader" from "enum_Member_role"');
  await db.query("ALTER TYPE \"enum_Member_role\" ADD VALUE 'APIReader' AFTER 'member'");

  logger.info('Removing enum value "Translator" from "enum_Member_role"');
  await db.query("ALTER TYPE \"enum_Member_role\" ADD VALUE 'Translator' AFTER 'member'");

  const appMessages = await db.query<{
    AppId: number;
    language: string;
    messages: NewMessages;
  }>('SELECT "AppId", language, messages FROM "AppMessages"', {
    type: QueryTypes.SELECT,
  });

  for (const record of appMessages) {
    const newMessages: Record<string, string> = {};
    for (const [id, value] of Object.entries({
      ...record.messages.app,
      ...record.messages.core,
      ...record.messages.messageIds,
    })) {
      newMessages[id] = value;
    }
    for (const [block, versions] of Object.entries(record.messages.blocks ?? {})) {
      for (const [version, messageIds] of Object.entries(versions)) {
        for (const [messageId, value] of Object.entries(messageIds)) {
          newMessages[`${block}/${version}/${messageId}`] = value;
        }
      }
    }

    logger.info(`Updating messages for AppId ${record.AppId}, language ${record.language}`);
    await db.query('UPDATE "AppMessages" SET messages = ? WHERE "AppId" = ? AND language = ?', {
      replacements: [JSON.stringify(newMessages), record.AppId, record.language],
      type: QueryTypes.UPDATE,
    });
  }
}
