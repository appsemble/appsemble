import { assertKoaCondition, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createCssHandler(
  type: 'coreStyle' | 'sharedStyle',
  { getAppStyles }: Options,
): Middleware {
  return async (ctx: Context) => {
    const styles = await getAppStyles({
      context: ctx,
      query: { attributes: [type], raw: true },
    });

    assertKoaCondition(styles != null, ctx, 404, 'App not found');

    ctx.body = styles[type] || '';
    ctx.type = 'css';
  };
}
