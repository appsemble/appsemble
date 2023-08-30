import { createGetMessages } from '@appsemble/node-utils';
import { compareStrings, defaultLocale, Permission } from '@appsemble/utils';
import { type Context } from 'koa';
import tags from 'language-tags';

import { App, AppMessages } from '../models/index.js';
import { options } from '../options/options.js';
import { checkAppLock } from '../utils/checkAppLock.js';
import { checkRole } from '../utils/checkRole.js';

export const getMessages = createGetMessages(options);

export async function createMessages(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { language },
    },
  } = ctx;

  const app = await App.findOne({ attributes: ['locked', 'OrganizationId'], where: { id: appId } });

  if (!app) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      message: 'App not found',
      error: 'Not Found',
    };
    ctx.throw();
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppMessages);

  if (!tags.check(language)) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      message: `Language “${language}” is invalid`,
      error: 'Bad Request',
    };
    ctx.throw();
  }

  const messages = Object.fromEntries(
    Object.entries(ctx.request.body.messages).filter(([, value]) => value),
  );
  await AppMessages.upsert({ AppId: appId, language: language.toLowerCase(), messages });
  ctx.body = { language: language.toLowerCase(), messages };
}

export async function deleteMessages(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, language },
  } = ctx;

  const app = await App.findOne({
    attributes: ['locked', 'OrganizationId'],
    where: { id: appId },
  });
  if (!app) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      message: 'App not found',
      error: 'Not Found',
    };
    ctx.throw();
  }

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppMessages);

  const affectedRows = await AppMessages.destroy({
    where: { language: language.toLowerCase(), AppId: appId },
  });

  if (!affectedRows) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      message: `App does not have messages for “${language}”`,
      error: 'Not Found',
    };
    ctx.throw();
  }
}

export async function getLanguages(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [{ model: AppMessages, required: false }],
  });

  if (!app) {
    ctx.response.status = 404;
    ctx.response.body = {
      status: 404,
      error: 'Not Found',
      message: 'App not found',
    };
    ctx.throw();
  }

  ctx.body = [
    ...new Set([
      ...app.AppMessages.map((message) => message.language),
      app.definition.defaultLanguage || defaultLocale,
    ]),
  ].sort(compareStrings);
}
