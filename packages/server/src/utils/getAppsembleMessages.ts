import { promises as fs } from 'fs';
import { join, resolve } from 'path';

const translationsDir = resolve(__dirname, '..', '..', '..', '..', 'i18n');

export async function getSupportedLanguages(): Promise<Set<string>> {
  const files = await fs.readdir(translationsDir);
  return new Set(files.map((lang) => lang.split('.json')[0].toLowerCase()));
}

/**
 * Fetch and merge the Appsemble core messages based on a language and a base language.
 *
 * @param language - The language to get the messages of.
 * @param baseLanguage - The base language of the language to get the messages of.
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
      JSON.parse(await fs.readFile(join(translationsDir, `${baseLang}.json`), 'utf-8')),
    );
  }

  if (languages.has(lang)) {
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
