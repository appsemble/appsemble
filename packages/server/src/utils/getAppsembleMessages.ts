import { promises as fs } from 'fs';
import { join, resolve } from 'path';

import { defaultLocale } from '@appsemble/utils';

const translationsDir = resolve(__dirname, '..', '..', '..', '..', 'translations');

export async function getSupportedLanguages(): Promise<Set<string>> {
  const files = await fs.readdir(translationsDir);
  return new Set(files.map((lang) => lang.split('.json')[0].toLowerCase()));
}

export async function getAppsembleMessages(
  language: string,
  baseLanguage?: string,
): Promise<Record<string, string>> {
  const lang = language.toLowerCase();
  const baseLang = baseLanguage?.toLowerCase();

  if (lang === defaultLocale) {
    return {};
  }

  const languages = await getSupportedLanguages();
  const messages = {};

  if (baseLang && baseLang !== defaultLocale && languages.has(baseLanguage)) {
    Object.assign(
      messages,
      JSON.parse(await fs.readFile(join(translationsDir, `${baseLang}.json`), 'utf-8')),
    );
  }

  if (lang !== defaultLocale && languages.has(lang)) {
    Object.assign(
      messages,
      Object.fromEntries(
        Object.entries(
          JSON.parse(await fs.readFile(join(translationsDir, `${lang}.json`), 'utf-8')),
        ).filter(([, value]) => Boolean(value)),
      ),
    );
  }

  return messages;
}
