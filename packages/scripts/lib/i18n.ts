import { promises as fs } from 'fs';
import { join, parse } from 'path';

import { defaultLocale } from '@appsemble/utils';
import { transformFileAsync } from '@babel/core';
import FormatJsPlugin from 'babel-plugin-formatjs';
import { Options as FormatJsPluginOptions } from 'babel-plugin-formatjs/types';
import ReactIntlAutoPlugin from 'babel-plugin-react-intl-auto';
import { readJson } from 'fs-extra';
import globby from 'globby';

type Translations = Record<string, Record<string, string>>;

const serverMessageKeys = [
  'server.emails.resend.subject',
  'server.emails.resend.body',
  'server.emails.welcome.subject',
  'server.emails.welcome.body',
  'server.emails.reset.subject',
  'server.emails.reset.body',
  'server.emails.appMemberEmailChange.subject',
  'server.emails.appMemberEmailChange.body',
];

export async function extractMessages(): Promise<Translations> {
  const translationsDir = 'i18n';

  const filenames = await fs.readdir(translationsDir);
  const locales = filenames.map((filename) => parse(filename).name);
  const paths = await globby('packages/**/messages.ts');

  const currentTranslations: Translations = Object.fromEntries(
    await Promise.all(
      filenames.map(async (filename) => [
        parse(filename).name,
        await readJson(join(translationsDir, filename)),
      ]),
    ),
  );
  const newTranslations: Translations = Object.fromEntries(locales.map((locale) => [locale, {}]));

  for (const path of paths) {
    await transformFileAsync(path, {
      ast: true,
      plugins: [
        [ReactIntlAutoPlugin, { removePrefix: 'packages/' }],
        [
          FormatJsPlugin,
          {
            preserveWhitespace: true,
            onMsgExtracted(filepath, messages) {
              for (const locale of locales) {
                if (locale === defaultLocale) {
                  for (const message of messages) {
                    newTranslations[locale][message.id] = message.defaultMessage;
                  }
                } else {
                  for (const message of messages) {
                    newTranslations[locale][message.id] =
                      currentTranslations[locale][message.id] || '';
                  }
                }
              }
            },
          } as FormatJsPluginOptions,
        ],
      ],
    });
  }

  for (const locale of locales) {
    for (const key of serverMessageKeys) {
      newTranslations[locale][key] = currentTranslations[locale][key] ?? '';
    }
  }

  return newTranslations;
}
