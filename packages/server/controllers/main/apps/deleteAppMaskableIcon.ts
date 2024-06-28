import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';
import { checkUserPermissions } from '../../../utils/authorization.js';

export async function deleteAppMaskableIcon(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'maskableIcon', 'OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');
  assertKoaError(!app.maskableIcon, ctx, 404, 'App has no maskable icon');

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.UpdateAppSettings]);
  await app.update({ maskableIcon: null });
}
