import {
  createAppRouter,
  getAppsembleMessages,
  getSupportedLanguages,
  render,
} from '@appsemble/node-utils';
import { defaultLocale, detectLocale } from '@appsemble/utils';
import { compare } from 'bcrypt';
import { type Middleware } from 'koa';
import getRawBody from 'raw-body';

import { options } from '../../options/options.js';
import { getApp, getAppPasswordToken } from '../../utils/app.js';
import { setCookie } from '../../utils/appCookies.js';

const router = createAppRouter(options);
const supportedLanguages = getSupportedLanguages();

export const appRouter: Middleware = async (ctx, next) => {
  const { app } = await getApp(ctx, { attributes: ['id', 'password', 'passwordMessage'] });
  const passwordToken = app && getAppPasswordToken(app);
  if (passwordToken) {
    ctx.set('Cache-Control', 'private,no-store');
    ctx.vary('Cookie');
  }
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
  const locale =
    detectLocale([...(await supportedLanguages)], ctx.acceptsLanguages()) || defaultLocale;
  const messages = await getAppsembleMessages(locale, defaultLocale);
  ctx.set('Content-Language', locale);
  ctx.vary('Accept-Language');
  return render(ctx, 'app/password.html', {
    error,
    locale,
    message: app.passwordMessage,
    title: messages['server.passwordPage.title'],
    heading: messages['server.passwordPage.heading'],
    passwordLabel: messages['server.passwordPage.password'],
    incorrectPassword: messages['server.passwordPage.incorrectPassword'],
    submitLabel: messages['server.passwordPage.submit'],
  });
};
