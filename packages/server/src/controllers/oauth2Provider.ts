import { createHash } from 'crypto';

import { badRequest, forbidden, notFound } from '@hapi/boom';
import { Context } from 'koa';
import { Op } from 'sequelize';

import { App, EmailAuthorization, Member, OAuth2Consent, User } from '../models';
import { createOAuth2AuthorizationCode } from '../utils/model';
import { hasScope } from '../utils/oauth2';

async function checkIsAllowed(app: App, user: User): Promise<boolean> {
  const policy = app.definition?.security?.default?.policy ?? 'everyone';
  if (policy === 'everyone') {
    return true;
  }

  if (policy === 'invite' && !app.Users.length) {
    return false;
  }

  if (policy === 'organization') {
    return Boolean(
      await Member.count({
        where: { OrganizationId: app.OrganizationId, UserId: user.id },
      }),
    );
  }
}

export async function getUserInfo(ctx: Context): Promise<void> {
  const { id } = ctx.user as User;

  const user = await User.findOne({
    attributes: ['primaryEmail', 'name', 'locale'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
    where: { id },
  });

  if (!user) {
    // The authenticated user may have been deleted.
    throw forbidden();
  }

  const picture = user.primaryEmail
    ? `https://www.gravatar.com/avatar/${createHash('md5')
        .update(user.primaryEmail)
        .digest('hex')}?s=128&d=mp`
    : null;

  ctx.body = {
    email: user.primaryEmail,
    email_verified: user.primaryEmail ? user.EmailAuthorizations[0].verified : false,
    name: user.name,
    picture,
    sub: id,
    locale: user.locale,
  };
}

export async function verifyOAuth2Consent(ctx: Context): Promise<void> {
  const {
    request: {
      body: { appId, redirectUri, scope },
    },
  } = ctx;
  const user = ctx.user as User;

  const app = await App.findByPk(appId, {
    attributes: ['definition', 'domain', 'id', 'path', 'OrganizationId'],
    include: [
      { model: OAuth2Consent, where: { UserId: user.id }, required: false },
      { model: User, where: { id: user.id }, required: false },
    ],
  });

  if (!app) {
    throw notFound('App not found');
  }

  const isAllowed = await checkIsAllowed(app, user);

  if (!app.OAuth2Consents?.length || !hasScope(app.OAuth2Consents[0].scope, scope)) {
    throw badRequest('User has not agreed to the requested scopes', {
      appName: app.definition.name,
      isAllowed,
    });
  }

  if (!isAllowed) {
    throw badRequest('User is not allowed to login due to the app’s security policy', {
      appName: app.definition.name,
      isAllowed,
    });
  }

  ctx.body = {
    ...(await createOAuth2AuthorizationCode(app, redirectUri, scope, user)),
    isAllowed: true,
  };
}

export async function agreeOAuth2Consent(ctx: Context): Promise<void> {
  const {
    request: {
      body: { appId, redirectUri, scope },
    },
  } = ctx;
  const user = ctx.user as User;

  const app = await App.findByPk(appId, {
    attributes: ['domain', 'definition', 'id', 'path', 'OrganizationId'],
    include: [OAuth2Consent, { model: User, where: { id: user.id }, required: false }],
  });

  if (!app) {
    throw notFound('App not found');
  }

  if (!(await checkIsAllowed(app, user))) {
    throw badRequest('User is not allowed to login due to the app’s security policy', {
      appName: app.definition.name,
      isAllowed: false,
    });
  }

  await OAuth2Consent.upsert({ AppId: appId, UserId: user.id, scope });
  ctx.body = await createOAuth2AuthorizationCode(app, redirectUri, scope, user);
}
