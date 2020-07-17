import { validateLanguage } from '@appsemble/utils';
import Boom from '@hapi/boom';
import tags from 'language-tags';
import { Op } from 'sequelize';

import { App, AppMessages } from '../models';
import type { KoaContext } from '../types';

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
  } catch (e) {
    throw Boom.badRequest(`Language “${language}” is invalid`);
  }

  const baseLanguage = tags(language)
    .subtags()
    .filter((sub) => sub.type() === 'language')?.[0]
    ?.toString();

  const app = await App.findByPk(appId, {
    attributes: [],
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

  if (!app.AppMessages.length) {
    throw Boom.notFound(`Language “${language}” could not be found`);
  }

  const [appMessages] = app.AppMessages;
  ctx.body = { language: appMessages.language, messages: appMessages.messages };
}

export async function createMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: {
      body: { language, messages },
    },
  } = ctx;

  const dbApp = await App.findOne({ where: { id: appId } });

  if (!dbApp) {
    throw Boom.notFound('App not found');
  }

  try {
    validateLanguage(language);
  } catch (e) {
    throw Boom.badRequest(`Language “${language}” is invalid`);
  }

  await AppMessages.upsert({ AppId: dbApp.id, language: language.toLowerCase(), messages });
  ctx.body = { language: language.toLowerCase(), messages };
}

export async function deleteMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, language },
  } = ctx;

  const dbApp = await App.findOne({
    where: { id: appId },
  });

  if (!dbApp) {
    throw Boom.notFound('App not found');
  }

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
    attributes: [],
    include: [{ model: AppMessages, required: false }],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = app.AppMessages.map((message) => message.language).sort();
}
