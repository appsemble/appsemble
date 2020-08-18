import type { AppMessages as AppMessagesInterface } from '@appsemble/types';
import { Permission, validateLanguage } from '@appsemble/utils';
import Boom from '@hapi/boom';
import tags from 'language-tags';
import { Op } from 'sequelize';

import { App, AppMessages } from '../models';
import type { KoaContext } from '../types';
import { checkRole } from '../utils/checkRole';

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
    throw Boom.badRequest(`Language “${language}” is invalid`);
  }

  const baseLanguage = tags(language)
    .subtags()
    .filter((sub) => sub.type() === 'language')?.[0]
    ?.toString();

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: AppMessages,
        where:
          merge && baseLanguage
            ? { language: { [Op.or]: [baseLanguage.toLowerCase(), language.toLowerCase()] } }
            : { language: language.toLowerCase() },
        required: false,
      },
    ],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  if (
    !app.AppMessages.length ||
    (merge && !app.AppMessages.some((m) => m.language === language.toLowerCase()))
  ) {
    if (language !== (app.definition.defaultLanguage || 'en-us')) {
      throw Boom.notFound(`Language “${language}” could not be found`);
    }
    ctx.body = { language, messages: {} };
    return;
  }

  const base: AppMessagesInterface = app.AppMessages.find(
    (m) => m.language === baseLanguage.toLowerCase(),
  );
  const messages = app.AppMessages.find((m) => m.language === language.toLowerCase());

  ctx.body = { language: messages.language, messages: { ...base?.messages, ...messages.messages } };
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
    throw Boom.notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditAppMessages);

  try {
    validateLanguage(language);
  } catch {
    throw Boom.badRequest(`Language “${language}” is invalid`);
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
    throw Boom.notFound('App not found');
  }

  await checkRole(ctx, app.OrganizationId, Permission.EditAppMessages);

  const affectedRows = await AppMessages.destroy({
    where: { language: language.toLowerCase(), AppId: appId },
  });

  if (!affectedRows) {
    throw Boom.notFound(`App does not have messages for “${language}”`);
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
    throw Boom.notFound('App not found');
  }

  ctx.body = [
    ...new Set([
      ...app.AppMessages.map((message) => message.language),
      app.definition.defaultLanguage || 'en-us',
    ]),
  ].sort();
}
