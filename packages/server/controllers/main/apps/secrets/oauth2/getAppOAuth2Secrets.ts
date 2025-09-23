import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';

export async function getAppOAuth2Secrets(ctx: Context): Promise<void> {
  const { appId } = ctx.pathParams;

  const app = await App.findByPk(appId, { attributes: ['OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { AppOAuth2Secret } = await getAppDB(appId);
  const appOAuth2Secrets = await AppOAuth2Secret.findAll();

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryAppSecrets],
  });

  ctx.body = appOAuth2Secrets;
}
