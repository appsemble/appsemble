import { randomBytes } from 'node:crypto';

import { assertKoaError, logger, throwKoaError, UserPropertiesError } from '@appsemble/node-utils';
import { hash } from 'bcrypt';
import { type Context } from 'koa';
import { DatabaseError, UniqueConstraintError } from 'sequelize';

import { App, AppMember, transactional, User } from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';
import { createJWTResponse } from '../../../../utils/createJWTResponse.js';

export async function registerAppMemberWithEmail(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request: {
      body: { locale, name, password, picture, properties = {}, timezone },
    },
  } = ctx;

  const email = ctx.request.body.email.toLowerCase();
  const hashedPassword = await hash(password, 10);
  const key = randomBytes(40).toString('hex');
  let user: User;

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
      model: AppMember,
      attributes: {
        exclude: ['picture'],
      },
      where: { email },
      required: false,
    },
  });

  assertKoaError(!app, ctx, 404, 'App could not be found.');
  assertKoaError(
    !app.enableSelfRegistration,
    ctx,
    401,
    'Self registration is disabled for this app.',
  );
  assertKoaError(
    !app.definition?.security?.default?.role,
    ctx,
    404,
    'This app has no security definition',
  );

  // XXX: This could introduce a race condition.
  // If this is not manually checked here, Sequelize never returns on
  // the AppMember.create() call if there is a conflict on the email index.
  assertKoaError(
    Boolean(app.AppMembers.length),
    ctx,
    409,
    'User with this email address already exists.',
  );

  try {
    await transactional(async (transaction) => {
      user = await User.create(
        {
          name,
          timezone,
          demoLoginUser: app.demoMode,
        },
        { transaction },
      );

      const parsedUserProperties: Record<string, any> = {};
      for (const [propertyName, propertyValue] of Object.entries(properties)) {
        try {
          parsedUserProperties[propertyName] = JSON.parse(propertyValue as string);
        } catch {
          parsedUserProperties[propertyName] = propertyValue;
        }
      }

      await AppMember.create(
        {
          UserId: user.id,
          AppId: appId,
          name,
          password: hashedPassword,
          email,
          role: app.definition.security.default.role,
          emailKey: key,
          picture: picture ? picture.contents : null,
          properties: parsedUserProperties,
          locale,
        },
        { transaction },
      );
    });
  } catch (error: unknown) {
    if (error instanceof UserPropertiesError) {
      throwKoaError(ctx, 400, error.message);
    }
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, 'User with this email address already exists.');
    }
    if (error instanceof DatabaseError) {
      // XXX: Postgres throws a generic transaction aborted error
      // if there is a way to read the internal error, replace this code.
      throwKoaError(ctx, 409, 'User with this email already exists.');
    }

    throw error;
  }

  const url = new URL('/Verify', getAppUrl(app));
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
        appName: app.definition.name,
        name: name || 'null',
      },
      app,
    })
    .catch((error: Error) => {
      logger.error(error);
    });

  ctx.body = createJWTResponse(user.id);
}
