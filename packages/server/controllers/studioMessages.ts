import { defaultLocale } from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import { Context } from 'koa';
import tags from 'language-tags';

import { getAppsembleMessages, getSupportedLanguages } from '../utils/getAppsembleMessages';

export async function getStudioMessages(ctx: Context): Promise<void> {
  const {
    pathParams: { language },
  } = ctx;

  if (!tags.check(language)) {
    throw badRequest(`Language code “${language}” is invalid`);
  }

  const lang = language.toLowerCase();
  const baseLanguage = String(
    tags(language)
      .subtags()
      .find((sub) => sub.type() === 'language'),
  ).toLowerCase();

  const languages = await getSupportedLanguages();
  if (!languages.has(lang) && !languages.has(baseLanguage)) {
    throw notFound(`Language “${language}” could not be found`);
  }

  const messages = await getAppsembleMessages(lang, baseLanguage);
  if (Object.keys(messages).length === 0 && baseLanguage !== defaultLocale) {
    throw notFound(`Language “${language}” could not be found`);
  }

  ctx.body = {
    language,
    messages: Object.fromEntries(
      Object.entries(messages).filter(
        ([key, value]) => (key.startsWith('studio') || key.startsWith('react-components')) && value,
      ),
    ),
  };
}

export async function getAppsembleLanguages(ctx: Context): Promise<void> {
  const languages = await getSupportedLanguages();
  ctx.body = [...languages].sort();
}
