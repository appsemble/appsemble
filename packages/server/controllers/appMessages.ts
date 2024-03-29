import { assertKoaError, createGetMessages, throwKoaError } from '@appsemble/node-utils';
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

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppMessages);

  if (!tags.check(language)) {
    throwKoaError(ctx, 400, `Language “${language}” is invalid`);
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

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppMessages);

  const affectedRows = await AppMessages.destroy({
    where: { language: language.toLowerCase(), AppId: appId },
  });

  assertKoaError(!affectedRows, ctx, 404, `App does not have messages for “${language}”`);
}

export async function getLanguages(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [{ model: AppMessages, required: false }],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  ctx.body = [
    ...new Set([
      ...app.AppMessages.map((message) => message.language),
      app.definition.defaultLanguage || defaultLocale,
    ]),
  ].sort(compareStrings);
}
