import { assertKoaError, type Options } from '@appsemble/node-utils';
import { type Context, type Middleware } from 'koa';

export function createReadmeHandler({ getApp, getAppReadmes }: Options): Middleware {
  return async (ctx: Context) => {
    const { id } = ctx.params;

    const app = await getApp({ context: ctx });

    assertKoaError(!app, ctx, 404, 'App not found');

    const appReadmes = await getAppReadmes({ app, context: ctx });
    const appReadme = appReadmes.find((readme) => readme.id === Number.parseInt(id));

    assertKoaError(!appReadme, ctx, 404, 'Readme not found');

    const { file } = appReadme;

    ctx.type = 'text/markdown';
    ctx.body = file;
  };
}
