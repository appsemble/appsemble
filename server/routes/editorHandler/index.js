import fs from 'fs';
import path from 'path';

/**
 * Serve `index.html` for editor related routes.
 */
export default async function editorHandler(ctx) {
  let filesystem = fs;
  let filename = path.resolve(__dirname, '../../../dist/index.html');
  if (process.env.NODE_ENV !== 'production') {
    filesystem = ctx.state.fs;
    filename = '/index.html';
  }
  ctx.body = await new Promise((resolve, reject) => {
    filesystem.readFile(filename, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
  ctx.type = 'text/html';
}
