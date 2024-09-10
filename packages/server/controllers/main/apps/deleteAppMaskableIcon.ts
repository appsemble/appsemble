import { assertKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';
import { checkRole } from '../../../utils/checkRole.js';

export async function deleteAppMaskableIcon(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'maskableIcon', 'OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.maskableIcon, ctx, 404, 'App has no maskable icon');

  await checkRole(ctx, app.OrganizationId, Permissions.EditAppSettings);
  await app.update({ maskableIcon: null });
}
