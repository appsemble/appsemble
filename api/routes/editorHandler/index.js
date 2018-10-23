import path from 'path';

import pug from 'pug';

const render = pug.compileFile(path.join(__dirname, 'editor.pug'));

/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function editorHandler(ctx) {
  const assets = ctx.state.getAssets().editor;
  ctx.body = render({ assets });
  ctx.type = 'text/html';
}
