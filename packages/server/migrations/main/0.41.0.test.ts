import { DataTypes, QueryTypes } from 'sequelize';
import { describe, expect, it } from 'vitest';

import { down, up } from './0.41.0.js';
import { App, AppMessages, getDB, Organization } from '../../models/index.js';

describe('migration 0.41.0', () => {
  it('should move password page messages to the default language of each app and back', async () => {
    const db = getDB();
    const transaction = await db.transaction();
    try {
      await db
        .getQueryInterface()
        .addColumn('App', 'passwordMessage', { type: DataTypes.TEXT }, { transaction });
      await Organization.create({ id: 'org' }, { transaction });
      const createApp = (path: string, defaultLanguage?: string): Promise<App> =>
        App.create(
          {
            OrganizationId: 'org',
            definition: { name: path, defaultLanguage, defaultPage: 'Home', pages: [] },
            path,
            vapidPrivateKey: '',
            vapidPublicKey: '',
          },
          { transaction },
        );
      const dutchApp = await createApp('dutch', 'nl_NL');
      const englishApp = await createApp('english');
      const silentApp = await createApp('silent', 'de');
      await db.query(
        `UPDATE "App" SET "passwordMessage" = CASE path
           WHEN 'dutch' THEN 'Vraag het team om toegang.'
           WHEN 'english' THEN 'Ask the team for access.'
         END`,
        { transaction },
      );
      await AppMessages.create(
        {
          AppId: dutchApp.id,
          language: 'nl-nl',
          messages: { app: { name: 'Nederlands' }, core: { 'app.login': 'Inloggen' } },
        },
        { transaction },
      );

      await up(transaction, db);

      const getMessages = async (): Promise<[number, string, unknown][]> =>
        (await AppMessages.findAll({ order: ['AppId', 'language'], transaction })).map(
          ({ AppId, language, messages }) => [AppId, language, messages],
        );
      expect(await getMessages()).toStrictEqual([
        [
          dutchApp.id,
          'nl-nl',
          {
            app: { name: 'Nederlands' },
            core: {
              'app.login': 'Inloggen',
              'server.passwordPage.message': 'Vraag het team om toegang.',
            },
          },
        ],
        [
          englishApp.id,
          'en',
          { core: { 'server.passwordPage.message': 'Ask the team for access.' } },
        ],
      ]);
      expect(
        await db.query(
          `SELECT column_name FROM information_schema.columns
           WHERE table_name = 'App' AND column_name = 'passwordMessage'`,
          { transaction, type: QueryTypes.SELECT },
        ),
      ).toStrictEqual([]);

      await AppMessages.create(
        {
          AppId: silentApp.id,
          language: 'en',
          messages: { core: { 'server.passwordPage.message': 'Only in English.' } },
        },
        { transaction },
      );
      await down(transaction, db);

      expect(
        await db.query('SELECT path, "passwordMessage" FROM "App" ORDER BY path', {
          transaction,
          type: QueryTypes.SELECT,
        }),
      ).toStrictEqual([
        { path: 'dutch', passwordMessage: 'Vraag het team om toegang.' },
        { path: 'english', passwordMessage: 'Ask the team for access.' },
        { path: 'silent', passwordMessage: null },
      ]);
      expect(await getMessages()).toStrictEqual([
        [dutchApp.id, 'nl-nl', { app: { name: 'Nederlands' }, core: { 'app.login': 'Inloggen' } }],
        [englishApp.id, 'en', { core: {} }],
        [silentApp.id, 'en', { core: {} }],
      ]);
    } finally {
      await transaction.rollback();
    }
  });
});
