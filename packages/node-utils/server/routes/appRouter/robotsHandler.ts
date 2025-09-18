import { assertKoaCondition, logger, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createRobotsHandler({ getApp }: Options): Middleware {
  return async (ctx: Context) => {
    const app = await getApp({ context: ctx, query: { attributes: ['id', 'visibility'] } });
    assertKoaCondition(app != null, ctx, 404, 'App not found');
    switch (app.visibility) {
      case 'public':
        ctx.body = 'User-agent: *\nAllow: *\n';
        break;
      case 'unlisted':
      case 'private':
        ctx.body = 'User-agent: *\nDisallow: /\n';
        break;
      default:
        logger.error('Unknown visibility', { visibility: app.visibility });
        ctx.status = 500;
        break;
    }
  };
}
