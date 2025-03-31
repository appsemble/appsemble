import { readdir } from 'node:fs/promises';
import { join, parse } from 'node:path';

import { readData } from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import { extract, type MessageDescriptor } from '@formatjs/cli-lib';
import { globby } from 'globby';
import sortKeys from 'sort-keys';

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
  'server.emails.organizationInvite.body',
  'server.emails.organizationInvite.subject',
  'server.emails.appInvite.body',
  'server.emails.appInvite.subject',
  'server.emails.groupInvite.body',
  'server.emails.groupInvite.subject',
  'server.emails.emailAdded.body',
  'server.emails.emailAdded.subject',
  'server.emails.appEmailQuotaLimitHit.body',
  'server.emails.appEmailQuotaLimitHit.subject',
];

export async function extractMessages(): Promise<Translations> {
  const translationsDir = 'i18n';

  const filenames = await readdir(translationsDir);
  const locales = filenames.map((filename) => parse(filename).name);
  const paths = await globby('packages/{app,react-components,studio}/**/*.{ts,tsx}');
  const messages: Record<string, MessageDescriptor> = JSON.parse(
    await extract(
      paths.filter((p) => !p.endsWith('.d.ts')),
      {
        preserveWhitespace: true,
      },
    ),
  );

  const currentTranslations: Translations = Object.fromEntries(
    await Promise.all(
      filenames.map(async (filename) => [
        parse(filename).name,
        (await readData(join(translationsDir, filename)))[0],
      ]),
    ),
  );
  const newTranslations: Translations = Object.fromEntries(locales.map((locale) => [locale, {}]));

  for (const locale of locales) {
    for (const [key, value] of Object.entries(messages)) {
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      newTranslations[locale][key] =
        locale === defaultLocale ? value.defaultMessage : (currentTranslations[locale][key] ?? '');
    }

    for (const key of serverMessageKeys) {
      newTranslations[locale][key] = currentTranslations[locale][key] ?? '';
    }
  }

  return sortKeys(newTranslations, { deep: true });
}
