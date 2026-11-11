import { OrganizationPermission } from '@appsemble/types';
import { type Context, type Next } from 'koa';
import { type Plugin } from 'koas-core';

import { App } from '../models/index.js';
import { getAppPasswordToken } from '../utils/app.js';
import { checkUserOrganizationPermissions } from '../utils/authorization.js';

async function checkAppPassword(ctx: Context, next: Next): Promise<void> {
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
  if (
    app?.password &&
    (ctx.get('x-appsemble-password-token') || ctx.query.passwordToken) !== getAppPasswordToken(app)
  ) {
    await checkUserOrganizationPermissions({
      context: ctx,
      organizationId: app.OrganizationId,
      requiredPermissions: [OrganizationPermission.QueryApps],
    });
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
  return () => checkAppPassword;
}
