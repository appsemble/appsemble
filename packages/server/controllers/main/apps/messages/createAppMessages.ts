import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import {
  type AppDefinition,
  type AppsembleMessages,
  OrganizationPermission,
} from '@appsemble/types';
import { AppMessageValidationError, validateMessages } from '@appsemble/utils';
import { type Context } from 'koa';
import tags from 'language-tags';

import { App, AppMessages } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
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
