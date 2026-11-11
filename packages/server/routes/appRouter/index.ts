import { createAppRouter, render } from '@appsemble/node-utils';
import { compare } from 'bcrypt';
import { type Middleware } from 'koa';
import getRawBody from 'raw-body';

import { options } from '../../options/options.js';
import { getApp, getAppPasswordToken } from '../../utils/app.js';
import { setCookie } from '../../utils/appCookies.js';

const router = createAppRouter(options);

export const appRouter: Middleware = async (ctx, next) => {
  const { app } = await getApp(ctx, { attributes: ['id', 'password', 'passwordMessage'] });
  const passwordToken = app && getAppPasswordToken(app);
  if (!passwordToken || ctx.cookies.get('app_password', { signed: true }) === passwordToken) {
    return router(ctx, next);
  }

  // Only pages show the password form, files such as scripts and the manifest are refused.
  if (/\.[a-z]\w*$/i.test(ctx.path)) {
    ctx.status = 401;
    return;
  }

  let error = false;
  if (ctx.method === 'POST') {
    const body = await getRawBody(ctx.req, { encoding: 'utf8', limit: '10kb' });
    const password = new URLSearchParams(body).get('password') ?? '';
    if (await compare(password, app.password!)) {
      setCookie(ctx, 'app_password', passwordToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        signed: true,
      });
      ctx.redirect(ctx.url);
      return;
    }
    error = true;
    ctx.status = 401;
  }
  return render(ctx, 'app/password.html', { error, message: app.passwordMessage });
};
