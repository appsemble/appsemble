import path from 'path';

import pug from 'pug';

import {
  select,
} from '../../utils/db';


const render = pug.compileFile(path.resolve(new URL(import.meta.url).pathname, '../index.pug'));
const render404 = pug.compileFile(path.resolve(new URL(import.meta.url).pathname, '../404.pug'));


function getAssets(ctx) {
  if (process.env.NODE_ENV === 'production') {
    return ctx.state.assets;
  }
  const { assetsByChunkName } = ctx.state.webpackStats.toJson();
  return assetsByChunkName.app;
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
