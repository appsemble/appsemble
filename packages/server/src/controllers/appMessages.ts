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

  if (
    !app.AppMessages.length ||
    (merge && !app.AppMessages.some((m) => m.language === language.toLowerCase()))
  ) {
    throw Boom.notFound('Language could not be found');
  }

  const base = app.AppMessages.find((m) => m.language === baseLanguage.toLowerCase()) ?? {};
  const messages = app.AppMessages.find((m) => m.language === language.toLowerCase());

  ctx.body = { ...base, ...messages };
}

export async function createMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: {
      body: { content, language },
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

  await AppMessages.upsert({ AppId: dbApp.id, language: language.toLowerCase(), content });
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
