import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppInvite } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function getAppInvites(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found.');

  await checkUserOrganizationPermissions(ctx, app.OrganizationId, [
    OrganizationPermission.QueryAppInvites,
  ]);

  const appInvites = await AppInvite.findAll({
    where: { AppId: appId },
  });

  ctx.body = appInvites.map(({ email }) => ({
    email,
  }));
}
