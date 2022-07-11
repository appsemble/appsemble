import { readdir, readFile } from 'fs/promises';
import { join, resolve } from 'path';

import { defaultLocale } from '@appsemble/utils';

const translationsDir = resolve(__dirname, '..', '..', '..', 'i18n');

export async function getSupportedLanguages(): Promise<Set<string>> {
  const files = await readdir(translationsDir);
  return new Set(files.map((lang) => lang.split('.json')[0].toLowerCase()));
}

/**
 * Fetch and merge the Appsemble core messages based on a language and a base language.
 *
 * @param language The language to get the messages of.
 * @param baseLanguage The base language of the language to get the messages of.
 * @returns The Appsemble core messages.
 */
export async function getAppsembleMessages(
  language: string,
  baseLanguage?: string,
): Promise<Record<string, string>> {
  const lang = language.toLowerCase();
  const baseLang = baseLanguage?.toLowerCase();

  const languages = await getSupportedLanguages();
  const messages = {};

  if (baseLang && languages.has(baseLanguage)) {
    Object.assign(
      messages,
      JSON.parse(await readFile(join(translationsDir, `${baseLang}.json`), 'utf8')),
    );
  }

  if (languages.has(lang)) {
    Object.assign(
      messages,
      Object.fromEntries(
        Object.entries(
          JSON.parse(await readFile(join(translationsDir, `${lang}.json`), 'utf8')),
        ).filter(([, value]) => Boolean(value)),
      ),
    );
  }

  // Fall back to reading the default locale’s messages if no core messages were found.
  if (!languages.has(lang) && (!baseLang || !languages.has(baseLang))) {
    Object.assign(
      messages,
      JSON.parse(await readFile(join(translationsDir, `${defaultLocale}.json`), 'utf8')),
    );
  }

  return messages;
}
