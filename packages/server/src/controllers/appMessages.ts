import { validateLanguage } from '@appsemble/utils';
import Boom from '@hapi/boom';

import { App, AppMessages } from '../models';
import type { KoaContext } from '../types';

interface Params {
  appId: string;
  language: string;
}

export async function getMessages(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, language },
  } = ctx;

  try {
    validateLanguage(language);
  } catch (e) {
    throw Boom.badRequest(`Language “${language}” is invalid`);
  }

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [{ model: AppMessages, where: { language: language.toLowerCase() }, required: false }],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  if (!app.AppMessages.length) {
    throw Boom.notFound('Language could not be found');
  }

  ctx.body = app.AppMessages[0].content;
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
