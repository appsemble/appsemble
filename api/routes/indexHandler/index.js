import path from 'path';

import pug from 'pug';

const render = pug.compileFile(path.resolve(__dirname, 'index.pug'));
const render404 = pug.compileFile(path.resolve(__dirname, '404.pug'));


/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function indexHandler(ctx) {
  const {
    id,
  } = ctx.params;
  const { App } = ctx.state.db;

  const record = await App.findById(id, { raw: true });
  const assets = await ctx.state.getAssets().app;

  if (!record) {
    ctx.body = render404({ assets });
    ctx.status = 404;
  } else {
    ctx.body = render({
      app: { ...record.definition, id },
      assets,
    });
  }
  ctx.type = 'text/html';
}
