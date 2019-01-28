/**
 * Serve `index.html` for editor related routes.
 */
export default async function editorHandler(ctx) {
  const { fs } = ctx.state;
  ctx.body = await new Promise((resolve, reject) => {
    fs.readFile('/index.html', (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
  ctx.type = 'text/html';
}
