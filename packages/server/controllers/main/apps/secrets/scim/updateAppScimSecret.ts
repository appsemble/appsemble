import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { App } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { checkRole } from '../../../../../utils/checkRole.js';
import { encrypt } from '../../../../../utils/crypto.js';

export async function updateAppScimSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'OrganizationId', 'scimEnabled', 'scimToken'],
  });
  await checkRole(ctx, app.OrganizationId, [Permissions.EditApps, Permissions.EditAppSettings]);

  ctx.assert(app, 404, 'App not found');

  const updates: Partial<Pick<App, 'scimEnabled' | 'scimToken'>> = {};
  if ('enabled' in body) {
    updates.scimEnabled = body.enabled;
  }
  if ('token' in body) {
    updates.scimToken = encrypt(body.token, argv.aesSecret) || null;
  }

  await app.update(updates);

  ctx.body = {
    enabled: app.scimEnabled,
    token: body.token || null,
  };
}
