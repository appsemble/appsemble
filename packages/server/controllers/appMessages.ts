import {
  assertKoaError,
  createGetMessages,
  getMessagesUtil,
  throwKoaError,
} from '@appsemble/node-utils';
import { type AppDefinition, type AppsembleMessages } from '@appsemble/types';
import {
  AppMessageValidationError,
  compareStrings,
  defaultLocale,
  Permission,
  validateMessages,
} from '@appsemble/utils';
import { type Context } from 'koa';
import tags from 'language-tags';

import { App, AppMessages } from '../models/index.js';
import { options } from '../options/options.js';
import { checkAppLock } from '../utils/checkAppLock.js';
import { checkRole } from '../utils/checkRole.js';

export const getMessages = createGetMessages(options);

async function validateAndCreateMessages(
  language: string,
  appId: number,
  bodyMessages: AppsembleMessages,
): Promise<void> {
  const messages = Object.fromEntries(Object.entries(bodyMessages).filter(([, value]) => value));
  await AppMessages.upsert({ AppId: appId, language: language.toLowerCase(), messages });
}

function validateMessageBodies(
  ctx: Context,
  appDefinition: AppDefinition,
  message: AppsembleMessages,
): void {
  try {
    validateMessages(message, appDefinition);
  } catch (error) {
    if (error instanceof AppMessageValidationError) {
      throwKoaError(ctx, 400, error.message);
    }
  }
}

export async function createMessages(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findOne({
    attributes: ['definition', 'locked', 'OrganizationId'],
    where: { id: appId },
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, Permission.EditAppMessages);

  if (Array.isArray(ctx.request.body)) {
    ctx.request.body.map((message) => {
      if (!tags.check(message.language)) {
        throwKoaError(ctx, 400, `Language “${message.language}” is invalid`);
      }
      validateMessageBodies(ctx, app.definition, message.messages);
    });
    ctx.request.body.map((message) => {
      (async () => {
        await validateAndCreateMessages(message.language, appId, message.messages);
      })();
    });
  } else {
    if (!tags.check(ctx.request.body.language)) {
      throwKoaError(ctx, 400, `Language “${ctx.request.body.language}” is invalid`);
    }
    validateMessageBodies(ctx, app.definition, ctx.request.body.messages);
    await validateAndCreateMessages(ctx.request.body.language, appId, ctx.request.body.messages);
  }

  ctx.body = Array.isArray(ctx.request.body)
    ? ctx.request.body
    : {
        language: ctx.request.body.language?.toLowerCase() || 'en',
        messages: ctx.request?.body?.messages,
      };
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
    query: { override },
    queryParams: { includeMessages },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [{ model: AppMessages, required: false }],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  if (includeMessages) {
    const result = [];
    for (const message of app.AppMessages) {
      result.push(await getMessagesUtil(ctx, message.language, appId, '', options, override));
    }
    ctx.body = result;
    return;
  }

  ctx.body = [
    ...new Set([
      ...app.AppMessages.map((message) => message.language),
      app.definition.defaultLanguage || defaultLocale,
    ]),
  ].sort(compareStrings);
}
