import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppOAuth2Secret } from '../../../../../models/index.js';
import { checkUserPermissions } from '../../../../../utils/authorization.js';

export async function deleteAppOAuth2Secret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appOAuth2SecretId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppOAuth2Secret, required: false, where: { id: appOAuth2SecretId } }],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.AppOAuth2Secrets?.length, ctx, 404, 'OAuth2 secret not found');

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.DeleteAppSecrets]);

  const [secret] = app.AppOAuth2Secrets;
  await secret.destroy();
}
