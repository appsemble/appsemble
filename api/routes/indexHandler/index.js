import path from 'path';

import pug from 'pug';

import {
  select,
} from '../../utils/db';


const render = pug.compileFile(path.resolve(__dirname, 'index.pug'));
const render404 = pug.compileFile(path.resolve(__dirname, '404.pug'));


function getAssets(ctx) {
  if (process.env.NODE_ENV === 'production') {
    return ctx.state.assets.app;
  }
  return ctx.state.webpackStats.toJson().assetsByChunkName.app;
}


/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function indexHandler(ctx) {
  const {
    id,
  } = ctx.params;

  const apps = await select('App', { id });
  const assets = await getAssets(ctx);

  if (apps.length === 0) {
    ctx.body = render404({ assets });
    ctx.status = 404;
  } else {
    ctx.body = render({
      app: apps[0],
      assets,
    });
  }
  ctx.type = 'text/html';
}
