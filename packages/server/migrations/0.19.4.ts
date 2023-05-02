import { AppsembleError } from '@appsemble/node-utils';
import { QueryTypes, type Sequelize } from 'sequelize';

export const key = '0.19.4';

/**
 * Summary:
 * - Update JSON of apps that contain subPages
 *
 * @param db The sequelize database.
 */
export async function up(db: Sequelize): Promise<void> {
  const apps = await db.query<{
    id: string;
    definition: {
      pages: { type: 'flow' | 'page' | 'tabs'; subPages: any; steps: any; tabs: any }[];
    };
  }>('SELECT definition, id FROM "App" WHERE definition->>\'pages\' LIKE \'%"subPages":%\'', {
    type: QueryTypes.SELECT,
  });

  for (const app of apps) {
    const subPageIds: number[] = [];
    for (const [index, page] of app.definition.pages.entries()) {
      subPageIds.push(index);
      if (page.type === 'flow') {
        page.steps = page.subPages;
        delete page.subPages;
      } else if (page.type === 'tabs') {
        page.tabs = page.subPages;
        delete page.subPages;
      }
    }

    await db.query('UPDATE "App" SET definition = ? WHERE id = ?', {
      type: QueryTypes.UPDATE,
      replacements: [JSON.stringify(app.definition), app.id],
    });

    const messages = await db.query<{
      AppId: string;
      language: string;
      messages: Record<'app', Record<string, string>>;
    }>(
      'SELECT "AppId", language, messages FROM "AppMessages" WHERE "AppId" = ? AND messages->>\'app\' LIKE \'%.subPages.%\'',
      {
        replacements: [app.id],
        type: QueryTypes.SELECT,
      },
    );

    for (const entry of messages) {
      entry.messages.app = Object.fromEntries(
        Object.entries(entry.messages.app).map(([k, value]) => {
          const match = /^pages\.(\d+)\.subPages\./.exec(k);
          if (match) {
            const index = Number(match[1]);
            if (index < app.definition.pages.length) {
              const { type } = app.definition.pages[index];

              if (type === 'flow') {
                return [k.replace('subPages', 'steps'), value];
              }
              if (type === 'tabs') {
                return [k.replace('subPages', 'tabs'), value];
              }
            }
          }
          return [k, value];
        }),
      );
      await db.query('UPDATE "AppMessages" SET messages = ? WHERE "AppId" = ? AND language = ?', {
        type: QueryTypes.UPDATE,
        replacements: [JSON.stringify(entry.messages), app.id, entry.language],
      });
    }
  }
}

/**
 * Summary:
 * - Not implemented
 */
export function down(): Promise<void> {
  throw new AppsembleError('This down migration is not implemented.');
}
