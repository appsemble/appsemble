import path from 'path';

import pug from 'pug';


const render = pug.compileFile(path.resolve(new URL(import.meta.url).pathname, '../index.pug'));


/**
 * https://developers.google.com/web/fundamentals/web-app-manifest
 */
export default async function indexHandler(ctx) {
  const {
    id,
  } = ctx.params;

  ctx.body = render({
    app: {
      id,
      name: 'Unlittered',
    },
  });
  ctx.type = 'text/html';
}
