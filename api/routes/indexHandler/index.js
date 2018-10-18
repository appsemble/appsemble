import path from 'path';

import pug from 'pug';

const render = pug.compileFile(path.join(__dirname, 'index.pug'));
const renderError = pug.compileFile(path.join(__dirname, 'error.pug'));

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function indexHandler(ctx) {
  const { path: p } = ctx.params;
  const { App } = ctx.state.db;
  ctx.type = 'text/html';
  const assets = await ctx.state.getAssets().app;

  try {
    const app = await App.findOne({ where: { path: p } });
    if (app == null) {
      ctx.body = renderError({
        assets,
        message: 'The app you are looking for could not be found.',
      });
      ctx.status = 404;
    } else {
      ctx.body = render({
        app,
        assets,
      });
    }
  } catch (error) {
    ctx.body = renderError({
      assets,
      message: 'There was a problem loading the app. Please try again later.',
    });
    ctx.status = 500;
  }
}
