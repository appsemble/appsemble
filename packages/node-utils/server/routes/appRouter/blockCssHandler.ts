import { assertKoaCondition, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createBlockCssHandler({ getApp, getAppBlockStyles }: Options): Middleware {
  return async (ctx: Context) => {
    const {
      params: { name },
    } = ctx;

    const app = await getApp({ context: ctx });

    assertKoaCondition(!!app, ctx, 404, 'App not found');

    const appBlockStyles = await getAppBlockStyles({ app, name, context: ctx });

    const [style] = appBlockStyles;
    ctx.body = style ? style.style : '';
    ctx.type = 'css';
  };
}
