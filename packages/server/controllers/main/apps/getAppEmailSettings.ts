import { assertKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';
import { checkRole } from '../../../utils/checkRole.js';

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

  await checkRole(ctx, app.OrganizationId, Permissions.EditAppSettings);

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
