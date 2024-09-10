import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppOAuth2Secret } from '../../../../../models/index.js';
import { checkRole } from '../../../../../utils/checkRole.js';

export async function updateAppOAuth2Secret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appOAuth2SecretId },
    request: {
      body: { id, ...body },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppOAuth2Secret, required: false, where: { id: appOAuth2SecretId } }],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.AppOAuth2Secrets?.length, ctx, 404, 'OAuth2 secret not found');

  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const [secret] = app.AppOAuth2Secrets;
  ctx.body = await secret.update({ ...body, userInfoUrl: body.userInfoUrl || null });
}
