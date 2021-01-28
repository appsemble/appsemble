import fs from 'fs/promises';
import { join } from 'path';

import { validateLanguage } from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';

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

  const languages = (await fs.readdir(join(__dirname, '../../../..', 'translations'))).map(
    (lang) => lang.split('.json')[0],
  );

  if (!languages.includes(language)) {
    throw notFound(`Language “${language}” could not be found`);
  }

  if (language === 'en-US') {
    ctx.body = { language, messages: {} };
    return;
  }

  const messages = JSON.parse(
    await fs.readFile(join(__dirname, '../../../..', 'translations', `${language}.json`), 'utf-8'),
  ) as Record<string, string>;

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
  const languages = (await fs.readdir(join(__dirname, '../../../../', 'translations'))).map(
    (lang) => lang.split('.json')[0],
  );

  ctx.body = [...new Set([...languages, 'en-US'])].sort();
}
