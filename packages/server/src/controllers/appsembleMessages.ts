import { promises as fs } from 'fs';
import { join, resolve } from 'path';

import { validateLanguage } from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import tags from 'language-tags';

import { KoaContext } from '../types';

interface Params {
  language: string;
  context: 'app' | 'studio';
}

const translationsDir = resolve(__dirname, '..', '..', '..', '..', 'translations');

async function getSupportedLanguages(): Promise<Set<string>> {
  const files = await fs.readdir(translationsDir);
  return new Set(files.map((lang) => lang.split('.json')[0].toLowerCase()));
}

export async function getAppsembleMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { language },
    query: { context },
  } = ctx;

  try {
    validateLanguage(language);
  } catch {
    throw badRequest(`Language code “${language}” is invalid`);
  }

  const languages = await getSupportedLanguages();
  const lang = language.toLowerCase();
  const baseLanguage = String(
    tags(language)
      .subtags()
      .find((sub) => sub.type() === 'language'),
  ).toLowerCase();

  if (!languages.has(lang) && !languages.has(baseLanguage)) {
    throw notFound(`Language “${language}” could not be found`);
  }

  if (lang === 'en') {
    ctx.body = { language, messages: {} };
    return;
  }

  const messages: Record<string, string> = {};

  if (languages.has(baseLanguage)) {
    Object.assign(
      messages,
      JSON.parse(await fs.readFile(join(translationsDir, `${baseLanguage}.json`), 'utf-8')),
    );
  }

  if (languages.has(lang)) {
    Object.assign(
      messages,
      JSON.parse(await fs.readFile(join(translationsDir, `${lang}.json`), 'utf-8')),
    );
  }

  ctx.body = {
    language,
    messages: Object.fromEntries(
      Object.entries(messages).filter(([key, value]) =>
        context
          ? (key.startsWith(context) || key.startsWith('react-components')) && Boolean(value)
          : Boolean(value),
      ),
    ),
  };
}

export async function getAppsembleLanguages(ctx: KoaContext<Params>): Promise<void> {
  const languages = await getSupportedLanguages();
  ctx.body = [...languages].sort();
}
