import { type Context, type Next } from 'koa';
import { type Plugin } from 'koas-core';

import { App } from '../models/index.js';
import { checkAppPassword } from '../utils/authorization.js';

async function checkRequestAppPassword(ctx: Context, next: Next): Promise<void> {
  const appId = ctx.pathParams?.appId;
  if (
    appId == null ||
    ctx.users?.scim ||
    ctx.users?.webhook ||
    [
      'acceptAppPayment',
      'assertAppSamlConsumerService',
      'getAppIcon',
      'getAppMemberPicture',
      'getAppRatings',
      'getAppReadme',
      'getAppSamlEntityId',
      'getAppScreenshot',
    ].includes(ctx.openApi!.operationObject!.operationId!)
  ) {
    return next();
  }

  const app = await App.findByPk(appId, { attributes: ['id', 'OrganizationId', 'password'] });
  if (app) {
    if (app.password) {
      ctx.vary('X-Appsemble-Password-Token');
    }
    await checkAppPassword(ctx, app);
  }
  return next();
}

/**
 * Refuse API requests for a password protected app, unless they carry the password token of the
 * app or come from a member of its organization.
 *
 * Store listing details, SCIM, webhooks with a secret, and callbacks of identity and payment
 * providers stay reachable, because their callers never load the app.
 *
 * @returns A Koas plugin which guards the API of password protected apps.
 */
export function appPasswordProtection(): Plugin {
  return () => checkRequestAppPassword;
}
