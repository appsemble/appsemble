import { getAppsembleMessages, getSupportedLanguages } from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import { type Context } from 'koa';
import tags from 'language-tags';

export async function getStudioMessages(ctx: Context): Promise<void> {
  const {
    pathParams: { language },
  } = ctx;

  if (!tags.check(language)) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: `Language code “${language}” is invalid`,
    };
    ctx.throw();
  }

  const lang = language.toLowerCase();
  const baseLanguage = String(
    tags(language)
      .subtags()
      .find((sub) => sub.type() === 'language'),
  ).toLowerCase();

  const languages = await getSupportedLanguages();
  if (!languages.has(lang) && !languages.has(baseLanguage)) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: `Language “${language}” could not be found`,
    };
    ctx.throw();
  }

  const messages = await getAppsembleMessages(lang, baseLanguage);
  if (Object.keys(messages).length === 0 && baseLanguage !== defaultLocale) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: `Language “${language}” could not be found`,
    };
    ctx.throw();
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
