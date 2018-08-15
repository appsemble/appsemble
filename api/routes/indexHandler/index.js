import path from 'path';

import pug from 'pug';


const render = pug.compileFile(path.resolve(new URL(import.meta.url).pathname, '../index.pug'));


function getAssets(ctx) {
  if (process.env.NODE_ENV === 'production') {
    return [];
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

  const assets = await getAssets(ctx);

  ctx.body = render({
    app: {
      id,
      name: 'Unlittered',
    },
    assets,
  });
  ctx.type = 'text/html';
}
