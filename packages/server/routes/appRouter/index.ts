import { createHash } from 'node:crypto';

import { createAppRouter } from '@appsemble/node-utils';
import { compare } from 'bcrypt';
import { type Middleware } from 'koa';

import { options } from '../../options/options.js';
import { getApp } from '../../utils/app.js';

const router = createAppRouter(options);

// A page load requests dozens of files, so the last password verified for each app is remembered
// instead of running bcrypt for every request.
const verifiedPasswords = new Map<number, string>();

export const appRouter: Middleware = async (ctx, next) => {
  const { app } = await getApp(ctx, { attributes: ['id', 'password'] });
  if (app?.password) {
    const [scheme, credentials = ''] = ctx.get('authorization').split(' ');
    const decoded = Buffer.from(credentials, 'base64').toString();
    // Any username is accepted, so only the password after the first colon is checked.
    const password = decoded.slice(decoded.indexOf(':') + 1);
    const digest = createHash('sha256').update(`${app.password}:${password}`).digest('base64');
    if (verifiedPasswords.get(app.id) !== digest) {
      if (scheme.toLowerCase() !== 'basic' || !(await compare(password, app.password))) {
        ctx.status = 401;
        ctx.set('WWW-Authenticate', 'Basic realm="App", charset="UTF-8"');
        ctx.body = 'This app is password protected.';
        return;
      }
      verifiedPasswords.set(app.id, digest);
    }
  }
  return router(ctx, next);
};
