import path from 'path';

import pug from 'pug';

import {
  select,
} from '../../utils/db';


const render = pug.compileFile(path.resolve(__dirname, 'editor.pug'));


function getAssets(ctx) {
  if (process.env.NODE_ENV === 'production') {
    return ctx.state.assets.editor;
  }
  return ctx.state.webpackStats.toJson().assetsByChunkName.editor;
}


/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function editorHandler(ctx) {
  const assets = await getAssets(ctx);
  ctx.body = render({ assets });
  ctx.type = 'text/html';
}
