import { type Context } from 'koa';

import { App } from '../models/index.js';

export async function getAppScimSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'scimEnabled', 'scimToken'] });

  ctx.assert(app, 404, 'App not found');

  ctx.body = {
    enabled: app.scimEnabled,
    token: app.scimToken || undefined,
  };
}

export async function updateAppScimSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'scimEnabled', 'scimToken'] });

  ctx.assert(app, 404, 'App not found');

  const updates: Partial<Pick<App, 'scimEnabled' | 'scimToken'>> = {};
  if ('enabled' in body) {
    updates.scimEnabled = body.enabled;
  }
  if ('token' in body) {
    updates.scimToken = body.token || null;
  }

  await app.update(updates);

  ctx.body = {
    enabled: app.scimEnabled,
    token: app.scimToken,
  };
}
