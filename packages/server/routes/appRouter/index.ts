import {
  createAppRouter,
  getAppsembleMessages,
  getSupportedLanguages,
  render,
} from '@appsemble/node-utils';
import { defaultLocale, detectLocale, normalizeLocale } from '@appsemble/utils';
import { compare } from 'bcrypt';
import { type Middleware } from 'koa';
import getRawBody from 'raw-body';
import { col, fn, Op, where } from 'sequelize';

import { App, AppMessages } from '../../models/index.js';
import { options } from '../../options/options.js';
import {
  APP_PASSWORD_TOKEN_MAX_AGE,
  createAppPasswordToken,
  getApp,
  isAppPasswordTokenValid,
} from '../../utils/app.js';
import { setCookie } from '../../utils/appCookies.js';
import {
  isSlidingWindowRateLimited,
  resetSlidingWindowRateLimit,
} from '../../utils/ratelimit/assertSlidingWindowRateLimit.js';

const router = createAppRouter(options);
const supportedLanguages = getSupportedLanguages();

export const appRouter: Middleware = async (ctx, next) => {
  const { app } = await getApp(ctx, { attributes: ['id', 'password'] });
  if (!app?.password) {
    return router(ctx, next);
  }
  ctx.set('Cache-Control', 'private,no-store');
  ctx.vary('Cookie');
  const passwordToken = ctx.cookies.get('app_password', { signed: true });
  if (isAppPasswordTokenValid(app, passwordToken)) {
    ctx.state.appPasswordToken = passwordToken;
    return router(ctx, next);
  }

  // Only pages show the password form, files such as scripts and the manifest are refused.
  if (/\.[a-z]\w*$/i.test(ctx.path)) {
    ctx.status = 401;
    return;
  }

  let error: 'incorrectPassword' | 'tooManyAttempts' | undefined;
  if (ctx.method === 'POST') {
    // 10 attempts per 15 minutes per client keeps the shared password from being guessed.
    const rateLimitKey = `appPassword:${app.id}`;
    if (await isSlidingWindowRateLimited(ctx, rateLimitKey, 10, 15 * 60 * 1000)) {
      error = 'tooManyAttempts';
      ctx.status = 429;
    } else {
      const body = await getRawBody(ctx.req, { encoding: 'utf8', limit: '10kb' });
      const password = new URLSearchParams(body).get('password') ?? '';
      if (await compare(password, app.password!)) {
        // Testers behind one IP address all enter the correct password, so only guesses add up.
        await resetSlidingWindowRateLimit(ctx, rateLimitKey);
        setCookie(ctx, 'app_password', createAppPasswordToken(app), {
          httpOnly: true,
          maxAge: APP_PASSWORD_TOKEN_MAX_AGE,
          sameSite: 'lax',
          secure: true,
          signed: true,
        });
        // The origin keeps a path such as //example.com from redirecting to another host.
        // nosemgrep: nodejs_scan.javascript-redirect-rule-express_open_redirect
        ctx.redirect(`${ctx.origin}${ctx.url}`);
        return;
      }
      error = 'incorrectPassword';
      ctx.status = 401;
    }
  }
  const locale =
    detectLocale([...(await supportedLanguages)], ctx.acceptsLanguages()) || defaultLocale;
  const messages = await getAppsembleMessages(locale, defaultLocale);
  const passwordMessage = fn(
    'json_extract_path_text',
    col('messages'),
    'core',
    'server.passwordPage.message',
  );
  // Reading only these values keeps large definitions and messages out of this unauthenticated page.
  const appWithMessages = (await App.findByPk(app.id, {
    attributes: [
      [fn('json_extract_path_text', col('definition'), 'defaultLanguage'), 'defaultLanguage'],
    ],
    include: {
      model: AppMessages,
      attributes: ['language', [passwordMessage, 'message']],
      required: false,
      where: where(passwordMessage, Op.ne, ''),
    },
  }))!;
  const translations = appWithMessages.AppMessages;
  // The message is in the visitor's language if the app has it, otherwise in its default language.
  const messageLanguage =
    detectLocale(
      translations.map(({ language }) => language),
      ctx.acceptsLanguages(),
    ) ??
    normalizeLocale((appWithMessages.get('defaultLanguage') as string | null) || defaultLocale);
  const message =
    (translations.find(({ language }) => language === messageLanguage)?.get('message') as
      string | undefined) ?? messages['server.passwordPage.message'];
  ctx.set('Content-Language', locale);
  ctx.vary('Accept-Language');
  return render(ctx, 'app/password.html', {
    error: error && messages[`server.passwordPage.${error}`],
    locale,
    message,
    title: messages['server.passwordPage.title'],
    heading: messages['server.passwordPage.heading'],
    passwordLabel: messages['server.passwordPage.password'],
    submitLabel: messages['server.passwordPage.submit'],
  });
};
