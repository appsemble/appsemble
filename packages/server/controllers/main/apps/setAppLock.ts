import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppScreenshot } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function setAppLock(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { locked },
    },
  } = ctx;

  const app = await App.findOne({
    where: { id: appId },
    attributes: ['id', 'OrganizationId', 'locked'],
    include: [{ model: AppScreenshot, attributes: ['id'] }],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  if (app.locked === 'fullLock' && !ctx.client) {
    throwKoaError(ctx, 403, 'This app can only be unlocked from the CLI.');
  }

  await checkUserOrganizationPermissions(ctx, app.OrganizationId, [
    OrganizationPermission.UpdateAppSettings,
  ]);
  await app.update({ locked });
}
