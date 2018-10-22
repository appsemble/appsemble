import fs from 'fs';

/**
 * Serve the minified Bulma CSS.
 *
 * @param {Koa.Context} ctx The Koa context.
 */
export default function bulmaHandler(ctx) {
  ctx.body = fs.readFileSync(require.resolve('bulma/css/bulma.min.css'));
  ctx.type = 'text/css';
  ctx.set('Cache-Control', 'public,maxage=31536000,immutable');
}
