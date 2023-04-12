import { getAppsembleMessages } from '@appsemble/node-utils/getAppsembleMessages.js';
import { mergeMessages } from '@appsemble/server/utils/mergeMessages.js';
import { AppsembleMessages } from '@appsemble/types';
import { defaultLocale, extractAppMessages, normalizeBlockName, Prefix } from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import { Context } from 'koa';
import tags from 'language-tags';

export async function getMessages(ctx: Context): Promise<void> {
  const {
    appBlocks: ctxAppBlocks,
    appMessages: ctxAppMessages,
    appsembleApp,
    blockConfigs: ctxBlockConfigs,
    pathParams: { language },
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

  const coreMessages = await getAppsembleMessages(lang, baseLang);

  const blockPrefixes: [string, Prefix][] = [];
  const appMessages: AppsembleMessages = {
    core: Object.fromEntries(
      Object.entries(coreMessages).filter(
        ([key]) =>
          key.startsWith('app') || key.startsWith('react-components') || key.startsWith('server'),
      ),
    ),
    blocks: {},
    ...extractAppMessages(appsembleApp.definition, (block, prefix) => {
      const blockName = normalizeBlockName(block.type);
      blockPrefixes.push([blockName, prefix]);
    }),
  };

  if (
    (!ctxAppMessages.length || (merge && !ctxAppMessages.some((m) => m.language === lang))) &&
    lang !== (appsembleApp.definition.defaultLanguage || defaultLocale)
  ) {
    throw notFound(`Language “${language}” could not be found`);
  }

  const baseLanguageMessages =
    override === 'true' && ctxAppMessages.find((m) => m.language === baseLang);
  const languageMessages = override === 'true' && ctxAppMessages.find((m) => m.language === lang);

  for (const appBlock of ctxAppBlocks) {
    const { name } = appBlock;

    const defaultMessages = appBlock.messages?.[defaultLocale];
    const blockBaseLanguageMessages = baseLang && appBlock.messages?.[baseLang];
    const blockLanguageMessages = appBlock.messages?.[language];

    const blockVersionMessages = {
      ...defaultMessages,
      ...Object.fromEntries(
        Object.entries(blockBaseLanguageMessages ?? {}).filter(([, value]) => value),
      ),
      ...Object.fromEntries(
        Object.entries(blockLanguageMessages ?? {}).filter(([, value]) => value),
      ),
    };

    if (appMessages.blocks[name]) {
      appMessages.blocks[name][appBlock.version] = blockVersionMessages;
    } else {
      appMessages.blocks[name] = {
        [appBlock.version]: blockVersionMessages,
      };
    }

    if (override !== 'true') {
      const prefixed = blockPrefixes.filter(([b]) => b === name);
      for (const [messageId, value] of Object.entries(blockVersionMessages)) {
        for (const [, prefix] of prefixed) {
          appMessages.app[`${prefix.join('.')}.${messageId}`] = value;
        }
      }
    }
  }

  ctx.body = {
    language: lang,
    messages: mergeMessages(
      appMessages,
      baseLanguageMessages?.messages ?? {},
      languageMessages?.messages ?? {},
    ),
  };
}
