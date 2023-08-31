import { getAppsembleMessages, getSupportedLanguages, throwKoaError } from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import { type Context } from 'koa';
import tags from 'language-tags';

export async function getStudioMessages(ctx: Context): Promise<void> {
  const {
    pathParams: { language },
  } = ctx;

  if (!tags.check(language)) {
    throwKoaError(ctx, 400, `Language code “${language}” is invalid`);
  }

  const lang = language.toLowerCase();
  const baseLanguage = String(
    tags(language)
      .subtags()
      .find((sub) => sub.type() === 'language'),
  ).toLowerCase();

  const languages = await getSupportedLanguages();
  if (!languages.has(lang) && !languages.has(baseLanguage)) {
    throwKoaError(ctx, 404, `Language “${language}” could not be found`);
  }

  const messages = await getAppsembleMessages(lang, baseLanguage);
  if (Object.keys(messages).length === 0 && baseLanguage !== defaultLocale) {
    throwKoaError(ctx, 404, `Language “${language}” could not be found`);
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
