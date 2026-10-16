import { type AppDefinition } from '@appsemble/lang-sdk';
import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { type AppsembleMessages, OrganizationPermission } from '@appsemble/types';
import { AppMessageValidationError, validateMessages } from '@appsemble/utils';
import { type Context } from 'koa';
import tags from 'language-tags';

import { App, AppMessages } from '../../../../models/index.js';
import { touchApp } from '../../../../utils/app.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { assertMessageSlugs, getAffectedLanguages } from '../../../../utils/appMessageSlugs.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';

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

export async function createAppMessages(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findOne({
    attributes: ['definition', 'locked', 'OrganizationId'],
    where: { id: appId },
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppMessages],
  });

  const body: { language: string; messages: AppsembleMessages }[] = Array.isArray(ctx.request.body)
    ? ctx.request.body
    : [ctx.request.body];

  for (const message of body) {
    if (!tags.check(message.language)) {
      throwKoaError(ctx, 400, `Language “${message.language}” is invalid`);
    }
    validateMessageBodies(ctx, app.definition, message.messages);
  }

  const stored = await AppMessages.findAll({
    attributes: ['language', 'messages'],
    where: { AppId: appId },
  });
  const messagesByLanguage = new Map(stored.map((row) => [row.language, row.messages]));
  for (const message of body) {
    messagesByLanguage.set(message.language.toLowerCase(), message.messages);
  }
  assertMessageSlugs(
    ctx,
    app.definition,
    messagesByLanguage,
    getAffectedLanguages(
      body.map((message) => message.language.toLowerCase()),
      stored.map((row) => row.language),
    ),
  );

  await Promise.all(
    body.map((message) => validateAndCreateMessages(message.language, appId, message.messages)),
  );

  await touchApp(appId);

  ctx.body = Array.isArray(ctx.request.body)
    ? ctx.request.body
    : {
        language: ctx.request.body.language?.toLowerCase() || 'en',
        messages: ctx.request?.body?.messages,
      };
}
