import { createGetUserInfo } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, AppMember, EmailAuthorization, Member, type User } from '../models/index.js';
import { options } from '../options/options.js';
import { createOAuth2AuthorizationCode } from '../utils/model.js';

async function checkIsAllowed(app: App, user: User): Promise<boolean> {
  const policy = app.definition?.security?.default?.policy ?? 'everyone';
  if (policy === 'everyone') {
    return true;
  }

  if (policy === 'invite' && !app.AppMembers.length) {
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

export const getUserInfo = createGetUserInfo(options);

export async function verifyOAuth2Consent(ctx: Context): Promise<void> {
  const {
    request: {
      body: { appId, redirectUri, scope },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition', 'domain', 'id', 'path', 'OrganizationId'],
    include: [{ model: AppMember, where: { UserId: user.id }, required: false }],
  });

  if (!app) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'App not found',
    };
    ctx.throw();
  }

  const isAllowed = await checkIsAllowed(app, user as User);

  if (!isAllowed) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'User is not allowed to login due to the app’s security policy',
      data: {
        isAllowed,
        appName: app.definition.name,
      },
    };
    ctx.throw();
  }

  if (!app.AppMembers?.length || app.AppMembers[0].consent == null) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'User has not agreed to the requested scopes',
      data: {
        isAllowed,
        appName: app.definition.name,
      },
    };
    ctx.throw();
  }

  ctx.body = {
    ...(await createOAuth2AuthorizationCode(app, redirectUri, scope, user as User, ctx)),
    isAllowed: true,
  };
}

export async function agreeOAuth2Consent(ctx: Context): Promise<void> {
  const {
    request: {
      body: { appId, redirectUri, scope },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['domain', 'definition', 'id', 'path', 'OrganizationId'],
    include: [{ model: AppMember, where: { UserId: user.id }, required: false }],
  });

  if (!app) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'App not found',
    };
    ctx.throw();
  }

  if (!(await checkIsAllowed(app, user as User))) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'User is not allowed to login due to the app’s security policy',
      data: {
        isAllowed: false,
      },
    };
    ctx.throw();
  }

  if (app.AppMembers.length) {
    await AppMember.update({ consent: new Date() }, { where: { id: app.AppMembers[0].id } });
  } else {
    await (user as User).reload({
      include: [
        {
          model: EmailAuthorization,
          where: { email: { [Op.col]: 'User.primaryEmail' } },
          required: false,
        },
      ],
    });
    await AppMember.create({
      AppId: app.id,
      UserId: user.id,
      name: user.name,
      email: user.primaryEmail,
      emailVerified: user.EmailAuthorizations?.[0]?.verified ?? false,
      role: app.definition.security.default.role,
      consent: new Date(),
    });
  }
  ctx.body = await createOAuth2AuthorizationCode(app, redirectUri, scope, user as User, ctx);
}
