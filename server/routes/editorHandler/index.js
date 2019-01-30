import path from 'path';

import fs from 'fs-extra';

/**
 * Serve `index.html` for editor related routes.
 */
export default async function editorHandler(ctx) {
  const { fs } = ctx.state;
  if (process.env.NODE_ENV === 'production') {
    ctx.body = await fs.readFile(path.resolve(__dirname, '../../../dist/index.html'))
  } else {
    ctx.body = await new Promise((resolve, reject) => {
      fs.readFile('/index.html', (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });
  }
  ctx.type = 'text/html';
}
