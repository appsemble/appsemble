import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppSamlSecret } from '../../../../../models/index.js';
import { checkUserPermissions } from '../../../../../utils/authorization.js';

export async function getAppSamlSecrets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret }],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.QueryAppSecrets]);

  ctx.body = app.AppSamlSecrets;
}
