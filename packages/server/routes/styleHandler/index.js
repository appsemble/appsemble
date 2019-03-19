import fs from 'fs';
import path from 'path';

import sass from 'node-sass';

/**
 * Serve the minified Bulma CSS.
 *
 * @param {Koa.Context} ctx The Koa context.
 */
export function bulmaHandler(ctx) {
  const { css } = sass.renderSync({
    file: path.resolve(__dirname, 'bulma.scss'),
    outputStyle: 'compressed',
  });

  ctx.body = css;
  ctx.type = 'text/css';
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
}

/**
 * Serve the minified FontAwesome CSS.
 *
 * @param {Koa.Context} ctx The Koa context.
 */
export function faHandler(ctx) {
  ctx.body = fs.readFileSync(require.resolve('@fortawesome/fontawesome-free/css/all.min.css'));
  ctx.type = 'text/css';
  ctx.set('Cache-Control', 'max-age=31536000,immutable');
}
