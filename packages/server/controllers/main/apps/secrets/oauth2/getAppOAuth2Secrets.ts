import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppOAuth2Secret } from '../../../../../models/index.js';
import { checkRole } from '../../../../../utils/checkRole.js';

export async function getAppOAuth2Secrets(ctx: Context): Promise<void> {
  const { appId } = ctx.pathParams;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [AppOAuth2Secret],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  ctx.body = app.AppOAuth2Secrets;
}
