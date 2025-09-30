import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';

export async function getAppSamlSecrets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['id', 'OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { AppSamlSecret } = await getAppDB(appId);
  const appSamlSecrets = await AppSamlSecret.findAll();

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryAppSecrets],
  });

  ctx.body = appSamlSecrets;
}
