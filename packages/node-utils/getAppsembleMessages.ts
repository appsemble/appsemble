import { readdir, readFile } from 'node:fs/promises';

import { defaultLocale, normalizeLocale } from '@appsemble/utils';

import { AppsembleError } from './AppsembleError.js';

const translationsDir = new URL('../../i18n/', import.meta.url);

async function getLanguageFiles(): Promise<Map<string, string>> {
  const files = await readdir(translationsDir);
  const result = new Map<string, string>();

  for (const file of files) {
    if (!file.endsWith('.json')) {
      continue;
    }

    const language = normalizeLocale(file.slice(0, -'.json'.length));
    if (result.has(language)) {
      throw new AppsembleError(`Found duplicate language codes: ‘${language}’`);
    }

    result.set(language, file);
  }

  return result;
}

export async function getSupportedLanguages(): Promise<Set<string>> {
  return new Set((await getLanguageFiles()).keys());
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
  const lang = normalizeLocale(language);
  const baseLang = baseLanguage ? normalizeLocale(baseLanguage) : undefined;

  const languages = await getLanguageFiles();
  const messages = {};

  if (baseLang && languages.has(baseLang)) {
    Object.assign(
      messages,
      JSON.parse(await readFile(new URL(languages.get(baseLang)!, translationsDir), 'utf8')),
    );
  }

  if (languages.has(lang)) {
    Object.assign(
      messages,
      Object.fromEntries(
        Object.entries(
          JSON.parse(await readFile(new URL(languages.get(lang)!, translationsDir), 'utf8')),
        ).filter(([, value]) => Boolean(value)),
      ),
    );
  }

  if (!languages.has(lang) && (!baseLang || !languages.has(baseLang))) {
    const defaultLanguage = normalizeLocale(defaultLocale);
    Object.assign(
      messages,
      JSON.parse(await readFile(new URL(languages.get(defaultLanguage)!, translationsDir), 'utf8')),
    );
  }

  return messages;
}
