/**
 * Serve `index.html` for editor related routes.
 */
export default async function editorHandler(ctx) {
  const { render } = ctx.state;
  ctx.body = await render('index.html');
  ctx.type = 'text/html';
}
