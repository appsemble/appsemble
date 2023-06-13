import {
  type BlockQueryItem,
  getAppsembleMessages,
  mergeMessages,
  type Options,
} from '@appsemble/node-utils';
import { type AppsembleMessages } from '@appsemble/types';
import {
  defaultLocale,
  extractAppMessages,
  normalizeBlockName,
  type Prefix,
} from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import { type Context, type Middleware } from 'koa';
import tags from 'language-tags';

export function createGetMessages({
  getApp,
  getAppMessages,
  getBlockMessages,
}: Options): Middleware {
  return async (ctx: Context) => {
    const {
      pathParams: { appId, language },
      query: { merge, override = 'true' },
    } = ctx;

    if (!tags.check(language)) {
      throw badRequest(`Language “${language}” is invalid`);
    }

    const lang = language.toLowerCase();

    const baseLanguage = tags(language)
      .subtags()
      .find((sub) => sub.type() === 'language');

    const baseLang = baseLanguage && String(baseLanguage).toLowerCase();

    const app = await getApp({ context: ctx, query: { where: { id: appId } } });

    if (!app) {
      throw notFound('App not found');
    }

    const appMessages = await getAppMessages({ context: ctx, app, language });

    const blockPrefixes: [string, Prefix][] = [];

    const blockQuery: BlockQueryItem[] = [];

    const coreMessages = await getAppsembleMessages(lang, baseLang);

    const messages: AppsembleMessages = {
      core: Object.fromEntries(
        Object.entries(coreMessages).filter(
          ([key]) =>
            key.startsWith('app') || key.startsWith('react-components') || key.startsWith('server'),
        ),
      ),
      blocks: {},
      ...extractAppMessages(app.definition, (block, prefix) => {
        const blockName = normalizeBlockName(block.type);
        const [org, name] = blockName.split('/');
        blockQuery.push({ version: block.version, OrganizationId: org.slice(1), name });
        blockPrefixes.push([blockName, prefix]);
      }),
    };

    const blockMessages = await getBlockMessages({ context: ctx, blockQuery, baseLang, lang });

    if (
      (!appMessages.length || (merge && !appMessages.some((m) => m.language === lang))) &&
      lang !== (app.definition.defaultLanguage || defaultLocale)
    ) {
      throw notFound(`Language “${language}” could not be found`);
    }

    const baseLanguageMessages =
      override === 'true' && appMessages.find((m) => m.language === baseLang);
    const languageMessages = override === 'true' && appMessages.find((m) => m.language === lang);

    for (const block of blockMessages) {
      const { name } = block;

      const defaultMessages = block.messages?.[defaultLocale];
      const blockBaseLanguageMessages = baseLang && block.messages?.[baseLang];
      const blockLanguageMessages = block.messages?.[language];

      const blockVersionMessages = {
        ...defaultMessages,
        ...Object.fromEntries(
          Object.entries(blockBaseLanguageMessages ?? {}).filter(([, value]) => value),
        ),
        ...Object.fromEntries(
          Object.entries(blockLanguageMessages ?? {}).filter(([, value]) => value),
        ),
      };

      if (messages.blocks[name]) {
        messages.blocks[name][block.version] = blockVersionMessages;
      } else {
        messages.blocks[name] = {
          [block.version]: blockVersionMessages,
        };
      }

      if (override !== 'true') {
        const prefixed = blockPrefixes.filter(([b]) => b === name);
        for (const [messageId, value] of Object.entries(blockVersionMessages)) {
          for (const [, prefix] of prefixed) {
            messages.app[`${prefix.join('.')}.${messageId}`] = value;
          }
        }
      }
    }

    ctx.body = {
      language: lang,
      messages: mergeMessages(
        messages,
        baseLanguageMessages?.messages ?? {},
        languageMessages?.messages ?? {},
      ),
    };
  };
}
