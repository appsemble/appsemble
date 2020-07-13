import { validateLanguage } from '@appsemble/utils';
import Boom from '@hapi/boom';

import { App, AppTranslation } from '../models';
import type { KoaContext } from '../types';

interface Params {
  appId: string;
  language: string;
}

export async function getTranslation(ctx: KoaContext<Params>): Promise<void> {
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
    include: [
      { model: AppTranslation, where: { language: language.toLowerCase() }, required: false },
    ],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  if (!app.AppTranslations.length) {
    throw Boom.notFound('Language could not be found');
  }

  ctx.body = app.AppTranslations[0].content;
}

export async function createTranslation(ctx: KoaContext<Params>): Promise<void> {
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

  await AppTranslation.upsert({ AppId: dbApp.id, language: language.toLowerCase(), content });
}

export async function getTranslations(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [{ model: AppTranslation, required: false }],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = app.AppTranslations.map((message) => message.language).sort();
}
