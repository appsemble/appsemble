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

  const baseLanguage = tags(language)
    .subtags()
    .find((sub) => sub.type() === 'language');

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: AppMessages,
        where:
          merge && baseLanguage
            ? {
                language: { [Op.or]: [String(baseLanguage).toLowerCase(), language.toLowerCase()] },
              }
            : { language: language.toLowerCase() },
        required: false,
      },
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  /**
   * We need:
   * - Appsemble Core translations
   * - Block translations
   * - Custom translations
   */

  const coreMessages = await getAppsembleMessages(language, baseLanguage && String(baseLanguage));
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
        where: { language: baseLanguage ? [language, String(baseLanguage)] : language },
      },
    ],
  });

  if (
    !app.AppMessages.length ||
    (merge && !app.AppMessages.some((m) => m.language === language.toLowerCase()))
  ) {
    if (language !== (app.definition.defaultLanguage || defaultLocale)) {
      throw notFound(`Language “${language}” could not be found`);
    }
    ctx.body = { language, messages: {} };
    return;
  }

  const base: MessagesInterface = app.AppMessages.find(
    (m) => m.language === String(baseLanguage).toLowerCase(),
  );
  const messages = app.AppMessages.find((m) => m.language === language.toLowerCase());
  const bm: Record<string, Record<string, Record<string, string>>> = {};

  blockMessages.forEach((version) => {
    const name = `${version.OrganizationId}/${version.name}`;
    if (!bm[name]) {
      bm[name] = { [version.version]: version.BlockMessages[0].messages };
    }

    bm[name][version.version] = version.BlockMessages[0].messages;
  });

  ctx.body = {
    language: messages.language,
    messages: { core: coreMessages, blocks: bm, app: { ...base?.messages, ...messages.messages } },
  };
}

export async function createMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: {
      body: { language, messages },
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
