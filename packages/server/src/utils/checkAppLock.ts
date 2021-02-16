import { forbidden } from '@hapi/boom';

import { App } from '../models';
import { KoaContext } from '../types';

/**
 * Check if the app is currently locked.
 *
 * Will throw a 403 error if the app is locked.
 *
 * @param ctx - The Koa context that can contain a force flag in its body
 * @param app - The app to check against
 */
export function checkAppLock(ctx: KoaContext, app: App): void {
  if (app.locked && !ctx.request.body?.force) {
    throw forbidden('App is currently locked.');
  }
}
