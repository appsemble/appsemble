import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
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

  assertKoaCondition(app != null, ctx, 404, 'App not found');
  if (app.locked === 'fullLock' && !ctx.client) {
    throwKoaError(ctx, 403, 'This app can only be unlocked from the CLI.');
  }

  await checkUserOrganizationPermissions({
    context: ctx,
    requiredPermissions: [OrganizationPermission.UpdateAppSettings],
    organizationId: app.OrganizationId,
  });

  await app.update({ locked });
}
