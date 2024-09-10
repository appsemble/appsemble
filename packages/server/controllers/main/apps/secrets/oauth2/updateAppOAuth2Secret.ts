import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppOAuth2Secret } from '../../../../../models/index.js';
import { checkUserPermissions } from '../../../../../utils/authorization.js';

export async function updateAppOAuth2Secret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appOAuth2SecretId },
    request: {
      body: { id, ...body },
    },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['OrganizationId'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  const appOAuth2Secret = await AppOAuth2Secret.findOne({
    where: {
      AppId: appId,
      id: appOAuth2SecretId,
    },
  });

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.UpdateAppSecrets]);

  assertKoaError(!appOAuth2Secret, ctx, 404, 'OAuth2 secret not found');

  ctx.body = await appOAuth2Secret.update({ ...body, userInfoUrl: body.userInfoUrl || null });
}
