import fs from 'fs';

/**
 * Serve the minified Bulma CSS.
 *
 * @param {Koa.Context} ctx The Koa context.
 */
export function bulmaHandler(ctx) {
  ctx.body = fs.readFileSync(require.resolve('bulma/css/bulma.min.css'));
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
