import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppOAuth2Secret } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';

export async function deleteAppOAuth2Secret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appOAuth2SecretId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppOAuth2Secret, required: false, where: { id: appOAuth2SecretId } }],
  });

  assertKoaCondition(!!app, ctx, 404, 'App not found');
  assertKoaCondition(!!app.AppOAuth2Secrets?.length, ctx, 404, 'OAuth2 secret not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.DeleteAppSecrets],
  });

  const [secret] = app.AppOAuth2Secrets;
  await secret.destroy();
}
