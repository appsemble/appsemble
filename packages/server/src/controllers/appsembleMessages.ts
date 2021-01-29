import { promises as fs } from 'fs';
import { join } from 'path';

import { validateLanguage } from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import tags from 'language-tags';

import { KoaContext } from '../types';

interface Params {
  language: string;
  context: 'app' | 'studio';
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

  const languages = new Set(
    (await fs.readdir(join(__dirname, '../../../..', 'translations'))).map((lang) =>
      lang.split('.json')[0].toLowerCase(),
    ),
  );

  const lang = language.toLowerCase();
  const baseLanguage = String(
    tags(language)
      .subtags()
      .find((sub) => sub.type() === 'language'),
  ).toLowerCase();

  if (!languages.has(lang) && !languages.has(baseLanguage)) {
    throw notFound(`Language “${language}” could not be found`);
  }

  if (lang === 'en-us') {
    ctx.body = { language, messages: {} };
    return;
  }

  let messages: Record<string, string> = {};

  if (languages.has(baseLanguage)) {
    messages = JSON.parse(
      await fs.readFile(
        join(__dirname, '../../../..', 'translations', `${baseLanguage}.json`),
        'utf-8',
      ),
    ) as Record<string, string>;
  }

  if (languages.has(lang)) {
    messages = {
      ...messages,
      ...(JSON.parse(
        await fs.readFile(join(__dirname, '../../../..', 'translations', `${lang}.json`), 'utf-8'),
      ) as Record<string, string>),
    };
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
  const languages = (
    await fs.readdir(join(__dirname, '../../../../', 'translations'))
  ).map((lang) => lang.split('.json')[0].toLowerCase());

  ctx.body = [...new Set([...languages, 'en-us'])].sort();
}
