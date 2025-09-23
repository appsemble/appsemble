import { type Options, serveIcon } from '@appsemble/node-utils';
import { isEqual, parseISO } from 'date-fns';
import { type Context, type Middleware } from 'koa';

export function createIconHandler({ getApp, getAppIcon, getDbUpdated }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      // @ts-expect-error Messed up
      params: { size = 128 },
      query: { maskable = false, updated },
    } = ctx;

    const app = await getApp({
      context: ctx,
      query: {
        attributes: ['id', 'icon', 'created', 'updated'],
        where: { ...(updated ? { updated } : {}) },
      },
    });
    const dbUpdated = app ? await getDbUpdated({ app, maskable, context: ctx }) : false;
    const appIcon = app ? await getAppIcon({ app, context: ctx }) : null;

    await serveIcon(ctx, {
      background: maskable ? app?.iconBackground || '#ffffff' : undefined,
      cache: dbUpdated ? isEqual(parseISO(updated as string), dbUpdated) : false,
      fallback: 'mobile-alt-solid.png',
      height: size && Number.parseInt(size as string),
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      icon: appIcon,
      maskable: Boolean(maskable),
      width: size && Number.parseInt(size as string),
    });
  };
}
