/**
 * Redirect the user to the root URL.
 *
 * @param ctx The Koa context.
 */
export default function redirectHandler(ctx) {
  ctx.redirect('/');
}
