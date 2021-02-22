import { defaultLocale, validateLanguage } from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import tags from 'language-tags';

import { KoaContext } from '../types';
import { getAppsembleMessages, getSupportedLanguages } from '../utils/getAppsembleMessages';

interface Params {
  language: string;
  context: 'app' | 'studio';
}

export async function getStudioMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { language },
  } = ctx;

  try {
    validateLanguage(language);
  } catch {
    throw badRequest(`Language code “${language}” is invalid`);
  }

  const lang = language.toLowerCase();
  const baseLanguage = String(
    tags(language)
      .subtags()
      .find((sub) => sub.type() === 'language'),
  ).toLowerCase();

  const messages = await getAppsembleMessages(lang, baseLanguage);
  if (messages === {} && baseLanguage !== defaultLocale) {
    throw notFound(`Language “${language}” could not be found`);
  }

  ctx.body = {
    language,
    messages: Object.fromEntries(
      Object.entries(messages).filter(
        ([key, value]) =>
          (key.startsWith('studio') || key.startsWith('react-components')) && Boolean(value),
      ),
    ),
  };
}

export async function getAppsembleLanguages(ctx: KoaContext<Params>): Promise<void> {
  const languages = await getSupportedLanguages();
  ctx.body = [...languages].sort();
}
