import { throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { type App } from '../models/index.js';

/**
 * Check if the app is currently locked.
 *
 * Will throw a 403 error if the app is locked.
 *
 * @param ctx The Koa context that can contain a force flag in its body
 * @param app The app to check against
 */
export function checkAppLock(ctx: Context, app: App): void {
  if (app.locked === 'studioLock' && !ctx.client) {
    throwKoaError(ctx, 403, 'App is currently locked.');
  } else if (app.locked === 'fullLock' && !ctx.request.body?.force) {
    throwKoaError(ctx, 403, 'App is currently locked.');
  }
}
