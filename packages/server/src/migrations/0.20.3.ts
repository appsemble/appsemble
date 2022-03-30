import { logger } from '@appsemble/node-utils';
import { normalize, partialNormalized } from '@appsemble/utils';
import { cloneDeep } from 'lodash';
import { QueryTypes, Sequelize } from 'sequelize';

export const key = '0.20.3';

interface AppQuery {
  id: number;
  coreStyle: string;
  sharedStyle: string;
  definition: { pages: { name: string }[] };
}

interface MessagesQuery {
  AppId: number;
  language: string;
  messages: { app: Record<string, string> };
}

function processAppsAndMessages(
  appsInput: AppQuery[],
  messagesInput: MessagesQuery[],
  downMigration?: boolean,
): { apps: AppQuery[]; messages: MessagesQuery[] } {
  const apps = cloneDeep(appsInput);
  const messages = cloneDeep(messagesInput);

  for (const app of apps) {
    const appMessages = messages.filter((m) => m.AppId === app.id);
    const replacementMap = app.definition.pages
      .map((page, index) =>
        downMigration
          ? [normalize(page.name), String(index)]
          : [String(index), normalize(page.name)],
      )
      // Reversed in order to prevent pages.10 being replaced by pages.1
      .reverse();

    logger.info(`Processing app ${app.id}`);
    for (const [oldKey, newKey] of replacementMap) {
      for (const appMessage of appMessages) {
        for (const name of Object.keys(appMessage.messages.app)) {
          if (name === `pages.${oldKey}` || name.startsWith(`pages.${oldKey}.`)) {
            appMessage.messages.app[name.replace(oldKey, newKey)] = appMessage.messages.app[name];
            delete appMessage.messages.app[name];
          }
        }
      }

      if (app.coreStyle?.includes(`pages.${oldKey}`)) {
        app.coreStyle = app.coreStyle.replaceAll(`pages.${oldKey}`, `pages.${newKey}`);
      }

      if (app.sharedStyle?.includes(`pages.${oldKey}`)) {
        app.sharedStyle = app.sharedStyle.replaceAll(`pages.${oldKey}`, `pages.${newKey}`);
      }
    }
  }

  return { apps, messages };
}

/**
 * Summary:
 * - Convert all path references for apps to use the page name instead of the index.
 *
 * @param db - The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const messagesInput = await db.query<MessagesQuery>(
    'SELECT "AppId", language, messages FROM "AppMessages" WHERE messages->>\'app\' ~ \'"pages\\.\\d+\'',
    {
      type: QueryTypes.SELECT,
    },
  );

  const appsInput = messagesInput.length
    ? await db.query<AppQuery>(
        'SELECT id, "coreStyle", "sharedStyle", definition FROM "App" WHERE "coreStyle" ~ \'pages\\.\\d+\' OR "sharedStyle" ~ \'pages\\.\\d+\' OR id IN (?)',
        { type: QueryTypes.SELECT, replacements: [messagesInput.map((m) => m.AppId)] },
      )
    : await db.query<AppQuery>(
        'SELECT id, "coreStyle", "sharedStyle", definition FROM "App" WHERE "coreStyle" ~ \'pages\\.\\d+\' OR "sharedStyle" ~ \'pages\\.\\d+\'',
        { type: QueryTypes.SELECT },
      );

  const { apps, messages } = processAppsAndMessages(appsInput, messagesInput);

  logger.info('Applying all changes to database.');
  await Promise.all([
    ...apps
      .filter((app) => app.coreStyle && app.sharedStyle)
      .map((app) =>
        db.query('UPDATE "App" SET "coreStyle" = ?, "sharedStyle" = ? WHERE id = ?', {
          type: QueryTypes.UPDATE,
          replacements: [app.coreStyle, app.sharedStyle, app.id],
        }),
      ),
    ...messages.map((m) =>
      db.query('UPDATE "AppMessages" SET messages = ? WHERE "AppId" = ? AND language = ?', {
        type: QueryTypes.UPDATE,
        replacements: [JSON.stringify(m.messages), m.AppId, m.language],
      }),
    ),
  ]);
}

/**
 * Summary:
 * - Convert all path references for apps to use the page index instead of the name.
 *
 * @param db - The sequelize database.
 */
export async function down(db: Sequelize): Promise<void> {
  const messagesInput = await db.query<MessagesQuery>(
    `SELECT "AppId", language, messages FROM "AppMessages" WHERE messages->>'app' ~ '"pages\\.${partialNormalized.source}'`,
    {
      type: QueryTypes.SELECT,
    },
  );

  const appsInput = messagesInput.length
    ? await db.query<AppQuery>(
        `SELECT id, "coreStyle", "sharedStyle", definition
         FROM "App"
         WHERE "coreStyle" ~ 'pages\\.${partialNormalized.source}'
         OR "sharedStyle" ~ 'pages\\.${partialNormalized.source}'
         OR id IN (?)`,
        { type: QueryTypes.SELECT, replacements: [messagesInput.map((m) => m.AppId)] },
      )
    : await db.query<AppQuery>(
        `SELECT id, "coreStyle", "sharedStyle", definition
         FROM "App"
         WHERE "coreStyle" ~ 'pages\\.${partialNormalized.source}'
         OR "sharedStyle" ~ 'pages\\.${partialNormalized.source}'`,
        { type: QueryTypes.SELECT },
      );

  const { apps, messages } = processAppsAndMessages(appsInput, messagesInput, true);

  logger.info('Applying all changes to database.');
  await Promise.all([
    ...apps.map((app) =>
      db.query('UPDATE "App" SET "coreStyle" = ?, "sharedStyle" = ? WHERE id = ?', {
        type: QueryTypes.UPDATE,
        replacements: [app.coreStyle, app.sharedStyle, app.id],
      }),
    ),
    ...messages.map((m) =>
      db.query('UPDATE "AppMessages" SET messages = ? WHERE "AppId" = ? AND language = ?', {
        type: QueryTypes.UPDATE,
        replacements: [JSON.stringify(m.messages), m.AppId, m.language],
      }),
    ),
  ]);
}
