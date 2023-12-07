import { randomBytes } from 'node:crypto';

import {
  assertKoaError,
  createGetAppMember,
  logger,
  serveIcon,
  throwKoaError,
} from '@appsemble/node-utils';
import {
  type AppAccount,
  type AppMember as AppMemberType,
  type SSOConfiguration,
} from '@appsemble/types';
import { has, Permission } from '@appsemble/utils';
import { hash } from 'bcrypt';
import { type Context } from 'koa';
import {
  DatabaseError,
  type FindOptions,
  type IncludeOptions,
  literal,
  Op,
  UniqueConstraintError,
} from 'sequelize';

import {
  App,
  AppMember,
  AppOAuth2Authorization,
  AppOAuth2Secret,
  AppSamlAuthorization,
  AppSamlSecret,
  Organization,
  transactional,
  User,
} from '../models/index.js';
import { options } from '../options/options.js';
import { applyAppMessages, getAppUrl, parseLanguage } from '../utils/app.js';
import { argv } from '../utils/argv.js';
import { checkRole } from '../utils/checkRole.js';
import { createJWTResponse } from '../utils/createJWTResponse.js';
import { getGravatarUrl } from '../utils/gravatar.js';

/**
 * Create an app member as JSON output from an app.
 *
 * @param app The app to output. A single app member should be present.
 * @param language The language to use.
 * @param baseLanguage The base language to use.
 * @returns The app member of the app.
 */
function outputAppMember(app: App, language: string, baseLanguage: string): AppAccount {
  const [member] = app.AppMembers;

  applyAppMessages(app, language, baseLanguage);

  const sso: SSOConfiguration[] = [];

  if (member.AppOAuth2Authorizations) {
    for (const { AppOAuth2Secret: secret } of member.AppOAuth2Authorizations) {
      sso.push({
        type: 'oauth2',
        icon: secret.icon,
        url: secret.dataValues.authorizatio,
        name: secret.name,
      });
    }
  }
  if (member.AppSamlAuthorizations) {
    for (const { AppSamlSecret: secret } of member.AppSamlAuthorizations) {
      sso.push({
        type: 'saml',
        icon: secret.icon,
        url: secret.ssoUrl,
        name: secret.name,
      });
    }
  }

  return {
    app: app.toJSON(),
    id: member.id,
    email: member.email,
    emailVerified: member.emailVerified,
    picture: member.picture
      ? String(
          new URL(
            `/api/apps/${app.id}/members/${
              member.UserId
            }/picture?updated=${member.updated.getTime()}`,
            argv.host,
          ),
        )
      : getGravatarUrl(member.email),
    name: member.name,
    role: member.role,
    properties: member.properties ?? {},
    sso,
  };
}

function createAppAccountQuery(user: User, include: IncludeOptions[]): FindOptions {
  return {
    attributes: {
      include: [
        [literal('"App".icon IS NOT NULL'), 'hasIcon'],
        [literal('"maskableIcon" IS NOT NULL'), 'hasMaskableIcon'],
      ],
      exclude: ['App.icon', 'maskableIcon', 'coreStyle', 'sharedStyle'],
    },
    include: [
      {
        model: Organization,
        attributes: {
          include: [
            'id',
            'name',
            'updated',
            [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
          ],
        },
      },
      {
        model: AppMember,
        attributes: {
          exclude: ['picture'],
        },
        where: { UserId: user.id },
        include: [
          {
            model: AppSamlAuthorization,
            required: false,
            include: [AppSamlSecret],
          },
          {
            model: AppOAuth2Authorization,
            required: false,
            include: [AppOAuth2Secret],
          },
        ],
      },
      ...include,
    ],
  };
}

export async function getAppMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition'],
    include: [
      {
        model: AppMember,
        attributes: {
          exclude: ['picture'],
        },
        include: [User],
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  const appMembers: AppMemberType[] = app.AppMembers.map((member) => ({
    id: member.UserId,
    name: member.name,
    primaryEmail: member.email,
    role: member.role,
    properties: member.properties,
  }));

  if (app.definition.security?.default?.policy !== 'invite') {
    const organization = await Organization.findByPk(app.OrganizationId, {
      include: [
        {
          model: User,
          where: { id: { [Op.not]: app.AppMembers.map((member) => member.UserId) } },
          required: false,
        },
      ],
    });

    for (const user of organization.Users) {
      appMembers.push({
        id: user.id,
        name: user.name,
        primaryEmail: user.primaryEmail,
        role: user?.AppMember?.role ?? app.definition.security.default.role,
      });
    }
  }

  ctx.body = appMembers;
}

export const getAppMember = createGetAppMember(options);

export async function setAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
    request: {
      body: { properties, role },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'id'],
    include: [
      {
        model: AppMember,
        attributes: {
          exclude: ['picture'],
        },
        required: false,
        where: { UserId: memberId },
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, Permission.EditApps);

  const user = await User.findByPk(memberId);

  assertKoaError(!user, ctx, 404, 'User with this ID doesn’t exist.');
  assertKoaError(
    !has(app.definition.security.roles, role),
    ctx,
    404,
    `Role ‘${role}’ is not defined`,
  );

  let member = app.AppMembers?.[0];

  if (member) {
    member.role = role;
    if (properties) {
      member.properties = properties;
    }
    await member.save();
  } else {
    member = await AppMember.create({
      UserId: user.id,
      AppId: app.id,
      role,
      properties,
    });
  }

  ctx.body = {
    id: user.id,
    name: member.name,
    primaryEmail: member.email,
    role,
    properties,
  };
}

export async function getAppAccounts(ctx: Context): Promise<void> {
  const { user } = ctx;
  const { baseLanguage, language, query } = parseLanguage(ctx, ctx.query?.language);

  const apps = await App.findAll(createAppAccountQuery(user as User, query));

  ctx.body = apps.map((app) => outputAppMember(app, language, baseLanguage));
}

export async function getAppAccount(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    user,
  } = ctx;
  const { baseLanguage, language, query } = parseLanguage(ctx, ctx.query?.language);

  const app = await App.findOne({
    where: { id: appId },
    ...createAppAccountQuery(user as User, query),
  });

  assertKoaError(!app, ctx, 404, 'App account not found');

  ctx.body = outputAppMember(app, language, baseLanguage);
}

export async function patchAppAccount(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request: {
      body: { email, locale, name, picture, properties },
    },
    user,
  } = ctx;
  const { baseLanguage, language, query } = parseLanguage(ctx, ctx.query?.language);

  const app = await App.findOne({
    where: { id: appId },
    ...createAppAccountQuery(user as User, query),
  });

  assertKoaError(!app, ctx, 404, 'App account not found');

  const [member] = app.AppMembers;
  const result: Partial<AppMember> = {};
  if (email != null && member.email !== email) {
    result.email = email;
    result.emailVerified = false;
    result.emailKey = randomBytes(40).toString('hex');

    const verificationUrl = new URL('/Verify', getAppUrl(app));
    verificationUrl.searchParams.set('token', result.emailKey);

    mailer
      .sendTranslatedEmail({
        appId,
        to: { email, name },
        locale: member.locale,
        emailName: 'appMemberEmailChange',
        values: {
          link: (text) => `[${text}](${verificationUrl})`,
          name: member.name || 'null',
          appName: app.definition.name,
        },
        app,
      })
      .catch((error: Error) => {
        logger.error(error);
      });
  }

  if (name != null) {
    result.name = name;
  }

  if (picture) {
    result.picture = picture.contents;
  }

  if (properties) {
    result.properties = properties;
  }

  if (locale) {
    result.locale = locale;
  }

  await member.update(result);
  ctx.body = outputAppMember(app, language, baseLanguage);
}

export async function getAppMemberPicture(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        model: AppMember,
        where: { [Op.or]: [{ id: memberId }, { UserId: memberId }] },
        required: false,
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App could not be found.');
  assertKoaError(!app.AppMembers.length, ctx, 404, 'This member does not exist.');
  assertKoaError(!app.AppMembers[0].picture, ctx, 404, 'This member has no profile picture set.');

  await serveIcon(ctx, {
    icon: app.AppMembers[0].picture,
    fallback: 'user-solid.png',
    raw: true,
  });
}

export async function registerMemberEmail(ctx: Context): Promise<void> {
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
        },
        { transaction },
      );

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
          properties,
          locale,
        },
        { transaction },
      );
    });
  } catch (error: unknown) {
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

export async function createMemberEmail(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request: {
      body: { locale, name, password, picture, properties = {}, role, timezone },
    },
  } = ctx;

  const email = ctx.request.body.email.toLowerCase();
  const hashedPassword = await hash(password, 10);
  const key = randomBytes(40).toString('hex');
  let createdUser: User;

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
    !app.definition?.security?.default?.role,
    ctx,
    404,
    'This app has no security definition',
  );

  if (role) {
    assertKoaError(
      !Object.keys(app.definition?.security?.roles).includes(role),
      ctx,
      400,
      'This role is not allowed!',
    );
  }

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
      createdUser = await User.create(
        {
          name,
          timezone,
        },
        { transaction },
      );

      await AppMember.create(
        {
          UserId: createdUser.id,
          AppId: appId,
          name,
          password: hashedPassword,
          email,
          role: role ?? app.definition.security.default.role,
          emailKey: key,
          picture: picture ? picture.contents : null,
          properties,
          locale,
        },
        { transaction },
      );
    });
  } catch (error: unknown) {
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

  ctx.body = createJWTResponse(createdUser.id);
}

export async function verifyMemberEmail(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { token },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition'],
    include: [
      {
        model: AppMember,
        attributes: ['id', 'emailVerified', 'emailKey'],
        required: false,
        where: {
          emailKey: token,
        },
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App could not be found.');
  assertKoaError(!app.AppMembers.length, ctx, 404, 'Unable to verify this token.');

  const [member] = app.AppMembers;
  member.emailVerified = true;
  member.emailKey = null;
  await member.save();

  ctx.status = 200;
}

export async function resendMemberEmailVerification(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request,
  } = ctx;

  const email = request.body.email.toLowerCase();

  const app = await App.findByPk(appId, {
    attributes: [
      'definition',
      'domain',
      'path',
      'OrganizationId',
      'emailHost',
      'emailUser',
      'emailPassword',
      'emailPort',
      'emailSecure',
    ],
    include: [
      { model: AppMember, attributes: { exclude: ['picture'] }, where: { email }, required: false },
    ],
  });

  if (app?.AppMembers.length && !app.AppMembers[0].emailVerified) {
    const url = new URL('/Verify', getAppUrl(app));
    url.searchParams.set('token', app.AppMembers[0].emailKey);

    mailer
      .sendTranslatedEmail({
        appId,
        emailName: 'resend',
        locale: app.AppMembers[0].locale,
        to: app.AppMembers[0],
        values: {
          link: (text) => `[${text}](${url})`,
          name: app.AppMembers[0].name || 'null',
          appName: app.definition.name,
        },
        app,
      })
      .catch((error: Error) => {
        logger.error(error);
      });
  }

  ctx.status = 204;
}
export async function requestMemberResetPassword(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId },
    request,
  } = ctx;

  const email = request.body.email.toLowerCase();
  const app = await App.findByPk(appId, {
    attributes: [
      'definition',
      'domain',
      'path',
      'emailName',
      'emailHost',
      'emailUser',
      'emailPassword',
      'emailPort',
      'emailSecure',
      'OrganizationId',
    ],
    include: [
      { model: AppMember, attributes: { exclude: ['picture'] }, where: { email }, required: false },
    ],
  });

  if (app?.AppMembers.length) {
    const [member] = app.AppMembers;
    const resetKey = randomBytes(40).toString('hex');

    const url = new URL('/Edit-Password', getAppUrl(app));
    url.searchParams.set('token', resetKey);

    await member.update({ resetKey });
    mailer
      .sendTranslatedEmail({
        to: member,
        from: app.emailName,
        emailName: 'reset',
        appId,
        locale: member.locale,
        values: {
          link: (text) => `[${text}](${url})`,
          appName: app.definition.name,
          name: member.name || 'null',
        },
        app,
      })
      .catch((error: Error) => {
        logger.error(error);
      });
  }

  ctx.status = 204;
}
export async function resetMemberPassword(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { token },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: {
      model: AppMember,
      attributes: ['id'],
      required: false,
      where: {
        resetKey: token,
      },
    },
  });

  assertKoaError(!app, ctx, 404, 'App could not be found.');
  assertKoaError(!app.AppMembers.length, ctx, 404, `Unknown password reset token: ${token}`);

  const password = await hash(ctx.request.body.password, 10);
  const [member] = app.AppMembers;

  await member.update({
    password,
    resetKey: null,
  });
}

export async function deleteAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    include: [
      {
        model: AppMember,
        attributes: ['id'],
        required: false,
        where: { UserId: memberId },
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  if (user.id !== memberId) {
    await checkRole(ctx, app.OrganizationId, Permission.EditApps);
  }

  const member = app.AppMembers?.[0];

  assertKoaError(!member, ctx, 404, 'App member not found');

  await member.destroy();
}
