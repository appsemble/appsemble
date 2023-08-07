import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { checkRole } from '../utils/checkRole.js';
import { decrypt, encrypt } from '../utils/crypto.js';

export async function getAppScimSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'OrganizationId', 'scimEnabled', 'scimToken'],
  });
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  ctx.assert(app, 404, 'App not found');

  let decryptedToken;
  if (app.scimToken) {
    decryptedToken = decrypt(app.scimToken, argv.aesSecret);
  }

  ctx.body = {
    enabled: app.scimEnabled,
    token: decryptedToken || undefined,
  };
}

export async function updateAppScimSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'OrganizationId', 'scimEnabled', 'scimToken'],
  });
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

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
