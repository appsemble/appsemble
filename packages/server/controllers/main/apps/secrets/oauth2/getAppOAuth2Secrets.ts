import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppOAuth2Secret } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';

export async function getAppOAuth2Secrets(ctx: Context): Promise<void> {
  const { appId } = ctx.pathParams;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [AppOAuth2Secret],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions(ctx, app.OrganizationId, [
    OrganizationPermission.QueryAppSecrets,
  ]);

  ctx.body = app.AppOAuth2Secrets;
}
