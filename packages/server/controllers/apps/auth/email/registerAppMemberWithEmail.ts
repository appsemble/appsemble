import { randomBytes } from 'node:crypto';

import {
  AppMemberPropertiesError,
  assertKoaCondition,
  logger,
  throwKoaError,
  uploadToBuffer,
} from '@appsemble/node-utils';
import { defaultLocale } from '@appsemble/utils';
import { hash } from 'bcrypt';
import { type Context } from 'koa';

import { App, AppMember, AppMessages } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';
import { parseAppMemberProperties } from '../../../../utils/appMember.js';
import { checkAppSecurityPolicy } from '../../../../utils/auth.js';
import { createJWTResponse } from '../../../../utils/createJWTResponse.js';

export async function registerAppMemberWithEmail(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request: {
      body: { locale, name, password, picture, properties = {}, timezone = '' },
    },
  } = ctx;

  const email = ctx.request.body.email.toLowerCase();
  const hashedPassword = await hash(password, 10);
  const key = randomBytes(40).toString('hex');

  const app = await App.findByPk(appId, {
    attributes: [
      'definition',
      'domain',
      'OrganizationId',
      'emailName',
      'emailHost',
      'emailUser',
      'emailPassword',
      'emailPort',
      'emailSecure',
      'path',
      'enableSelfRegistration',
      'demoMode',
    ],
    include: {
      model: AppMessages,
      required: false,
      where: {
        language: locale ?? defaultLocale,
      },
    },
  });

  assertKoaCondition(app != null, ctx, 404, 'App could not be found.');
  assertKoaCondition(
    app.enableSelfRegistration,
    ctx,
    401,
    'Self registration is disabled for this app.',
  );

  assertKoaCondition(
    app.definition?.security != null,
    ctx,
    401,
    'This app has no security definition',
  );

  assertKoaCondition(
    await checkAppSecurityPolicy(app),
    ctx,
    401,
    'App member is not allowed to register due to the app’s security policy',
    { isAllowed: false },
  );

  assertKoaCondition(
    app.definition?.security?.default?.role != null,
    ctx,
    401,
    'This app has no default role',
  );

  const appMemberExists = await AppMember.count({
    where: { email, AppId: appId },
  });

  assertKoaCondition(
    !appMemberExists,
    ctx,
    409,
    'App member with this email address already exists.',
  );

  let appMember = { id: '' } as AppMember;
  try {
    appMember = await AppMember.create({
      AppId: appId,
      name,
      password: hashedPassword,
      email,
      role: app.definition.security.default.role,
      emailKey: key,
      picture: picture ? await uploadToBuffer(picture.path) : null,
      properties: parseAppMemberProperties(properties),
      timezone,
      locale,
      demo: app.demoMode,
    });
  } catch (error: unknown) {
    if (error instanceof AppMemberPropertiesError) {
      throwKoaError(ctx, 400, error.message);
    }

    throw error;
  }

  const url = new URL(`/${locale ?? defaultLocale}/Verify`, getAppUrl(app));
  url.searchParams.set('token', key);

  // This is purposely not awaited, so failure won’t make the request fail. If this fails, the user
  // will still be logged in, but will have to request a new verification email in order to verify
  // their account.
  mailer
    .sendTranslatedEmail({
      to: { email, name },
      from: app.emailName,
      appId,
      emailName: 'welcome',
      locale,
      values: {
        link: (text) => `[${text}](${url})`,
        appName: app.AppMessages?.[0]?.messages?.app?.name ?? app.definition.name,
        name: name || 'null',
      },
      app,
    })
    .catch((error: Error) => {
      logger.error(error);
    });

  ctx.body = createJWTResponse(appMember.id);
}
