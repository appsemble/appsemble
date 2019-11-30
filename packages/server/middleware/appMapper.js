import { partialNormalized } from '@appsemble/utils';
import isIp from 'is-ip';

const appURLPattern = new RegExp(`^/@${partialNormalized.source}/${partialNormalized.source}`);

export default function appMapper(platformMiddleware, appMiddleware, fallbackMiddleware) {
  return async (ctx, next) => {
    const { argv, db, hostname, path } = ctx;
    const { App } = db.models;

    let app;

    if (new URL(argv.host).hostname === hostname) {
      const match = path.match(appURLPattern);
      if (!match) {
        return platformMiddleware(ctx, next);
      }
      app = await App.findOne({
        raw: true,
        where: { OrganizationId: match[1], path: match[2] },
      });
      [ctx.state.base] = match;
    } else {
      app = await App.findOne({
        raw: true,
        where: { domain: hostname },
      });
      if (!app && isIp(hostname)) {
        return platformMiddleware(ctx, next);
      }
      ctx.state.base = '';
    }

    if (app) {
      ctx.state.app = app;
      return appMiddleware(ctx, next);
    }

    return fallbackMiddleware(ctx, next);
  };
}
