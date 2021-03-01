import { Messages as MessagesInterface } from '@appsemble/types';
import {
  defaultLocale,
  filterBlocks,
  getAppBlocks,
  Permission,
  validateLanguage,
} from '@appsemble/utils';
import { badRequest, notFound } from '@hapi/boom';
import tags from 'language-tags';
import { Op } from 'sequelize';

import { App, AppMessages, BlockMessages, BlockVersion } from '../models';
import { KoaContext } from '../types';
import { checkAppLock } from '../utils/checkAppLock';
import { checkRole } from '../utils/checkRole';
import { getAppsembleMessages } from '../utils/getAppsembleMessages';

interface Params {
  appId: string;
  language: string;
}

export async function getMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, language },
    query: { merge },
  } = ctx;

  try {
    validateLanguage(language);
  } catch {
    throw badRequest(`Language “${language}” is invalid`);
  }

  const lang = language.toLowerCase();
  const baseLanguage = tags(language)
    .subtags()
    .find((sub) => sub.type() === 'language');
  const baseLang = baseLanguage && String(baseLanguage).toLowerCase();

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: AppMessages,
        where:
          merge && baseLang
            ? {
                language: { [Op.or]: [baseLang, lang] },
              }
            : { language: lang },
        required: false,
      },
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  const coreMessages = await getAppsembleMessages(lang, baseLang);
  const blocks = filterBlocks(Object.values(getAppBlocks(app.definition)));
  const blockMessages = await BlockVersion.findAll({
    attributes: ['name', 'version', 'OrganizationId', 'id'],
    where: {
      [Op.or]: blocks.map((block) => {
        const [org, name] = block.type.split('/');
        return { OrganizationId: org.slice(1), name, version: block.version };
      }),
    },
    include: [
      {
        model: BlockMessages,
        where: {
          language: baseLang ? [lang, baseLang, defaultLocale] : [lang, defaultLocale],
        },
      },
    ],
  });

  if (
    (!app.AppMessages.length || (merge && !app.AppMessages.some((m) => m.language === lang))) &&
    lang !== (app.definition.defaultLanguage || defaultLocale)
  ) {
    throw notFound(`Language “${language}” could not be found`);
  }

  const base: MessagesInterface = app.AppMessages.find((m) => m.language === baseLang);
  const messages = app.AppMessages.find((m) => m.language === lang);
  const bm: Record<string, Record<string, Record<string, string>>> = {};

  blockMessages.forEach((version) => {
    const name = `@${version.OrganizationId}/${version.name}`;
    const defaultMessages = version.BlockMessages.find((m) => m.language === defaultLocale);
    const baseLanguageMessages =
      baseLang && version.BlockMessages.find((m) => m.language === baseLang);
    const languageMessages = version.BlockMessages.find((m) => m.language === language);

    const blockVersionMessages = {
      ...defaultMessages.messages,
      ...Object.fromEntries(
        Object.entries(baseLanguageMessages?.messages ?? {}).filter(([, value]) => value),
      ),
      ...Object.fromEntries(
        Object.entries(languageMessages?.messages ?? {}).filter(([, value]) => value),
      ),
    };
    if (bm[name]) {
      bm[name][version.version] = blockVersionMessages;
    } else {
      bm[name] = {
        [version.version]: blockVersionMessages,
      };
    }
  });

  ctx.body = {
    language: lang,
    messages: {
      core: Object.fromEntries(
        Object.entries(coreMessages).filter(
          ([key]) => key.startsWith('app') || key.startsWith('react-components'),
        ),
      ),
      blocks: bm,
      app: { ...base?.messages, ...messages?.messages },
    },
  };
}

export async function createMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: {
      body: { language },
    },
  } = ctx;

  const app = await App.findOne({ where: { id: appId } });

  if (!app) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppMessages);

  try {
    validateLanguage(language);
  } catch {
    throw badRequest(`Language “${language}” is invalid`);
  }

  const messages = Object.fromEntries(
    Object.entries(ctx.request.body.messages).filter(([, value]) => value),
  );
  await AppMessages.upsert({ AppId: app.id, language: language.toLowerCase(), messages });
  ctx.body = { language: language.toLowerCase(), messages };
}

export async function deleteMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, language },
  } = ctx;

  const app = await App.findOne({
    where: { id: appId },
  });

  if (!app) {
    throw notFound('App not found');
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppMessages);

  const affectedRows = await AppMessages.destroy({
    where: { language: language.toLowerCase(), AppId: appId },
  });

  if (!affectedRows) {
    throw notFound(`App does not have messages for “${language}”`);
  }
}

export async function getLanguages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [{ model: AppMessages, required: false }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  ctx.body = [
    ...new Set([
      ...app.AppMessages.map((message) => message.language),
      app.definition.defaultLanguage || defaultLocale,
    ]),
  ].sort();
}
