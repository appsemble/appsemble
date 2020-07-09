import Boom from '@hapi/boom';
import bcp47 from 'bcp-47';

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

  const bcp = bcp47.parse(language);
  const lang = bcp47.stringify(bcp);

  if (!lang) {
    throw Boom.badRequest(`Language “${language}” is invalid`);
  }

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [{ model: AppTranslation, where: { language: lang.toLowerCase() }, required: false }],
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

  const bcp = bcp47.parse(language);
  const lang = bcp47.stringify(bcp);

  if (!lang) {
    throw Boom.badRequest(`Language “${language}” is invalid`);
  }

  await AppTranslation.create({ AppId: dbApp.id, language: lang.toLowerCase(), content });
}

export async function getTranslations(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, language },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [{ model: AppTranslation, where: { language }, required: false }],
  });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  ctx.body = app.Assets.map((asset) => ({
    id: asset.id,
    mime: asset.mime,
    filename: asset.filename,
  }));
}
