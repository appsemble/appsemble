import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { App } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { checkRole } from '../../../../../utils/checkRole.js';
import { decrypt } from '../../../../../utils/crypto.js';

export async function getAppScimSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'OrganizationId', 'scimEnabled', 'scimToken'],
  });
  await checkRole(ctx, app.OrganizationId, [Permissions.EditApps, Permissions.EditAppSettings]);

  ctx.assert(app, 404, 'App not found');

  let decryptedToken;
  if (app.scimToken) {
    try {
      decryptedToken = decrypt(app.scimToken, argv.aesSecret);
    } catch {
      // Do nothing
    }
  }

  ctx.body = {
    enabled: app.scimEnabled,
    token: decryptedToken || undefined,
  };
}
