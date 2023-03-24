import { isEqual, parseISO } from 'date-fns';
import { Context, Middleware } from 'koa';

import { serveIcon } from '../icon.js';
import { AppRouterOptions } from '../types.js';

export function createIconHandler({
  getApp,
  getAppIcon,
  getDbUpdated,
}: AppRouterOptions): Middleware {
  return async (ctx: Context) => {
    const {
      params: { size = 128 },
      query: { maskable = false, updated },
    } = ctx;

    const app = await getApp({ context: ctx, query: { maskable, updated } });
    const dbUpdated = app ? await getDbUpdated({ app, maskable, context: ctx }) : false;
    const appIcon = app?.iconUrl ? await getAppIcon({ app, context: ctx }) : null;

    await serveIcon(ctx, {
      background: maskable ? app.iconBackground || '#ffffff' : undefined,
      cache: dbUpdated ? isEqual(parseISO(updated as string), dbUpdated) : false,
      fallback: 'mobile-alt-solid.png',
      height: size && Number.parseInt(size as string),
      icon: appIcon,
      maskable: Boolean(maskable),
      width: size && Number.parseInt(size as string),
    });
  };
}
