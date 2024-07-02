import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function getAppEmailSettings(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [
      'emailName',
      'emailHost',
      'emailUser',
      'emailPassword',
      'emailPort',
      'emailSecure',
      'id',
      'OrganizationId',
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions(ctx, app.OrganizationId, [
    OrganizationPermission.ReadAppSettings,
  ]);

  const { emailHost, emailName, emailPassword, emailPort, emailSecure, emailUser } = app;

  ctx.body = {
    emailName,
    emailHost,
    emailUser,
    emailPort,
    emailSecure,
    emailPassword: Boolean(emailPassword?.length),
  };
}
