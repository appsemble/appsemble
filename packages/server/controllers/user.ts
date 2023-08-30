import { randomBytes } from 'node:crypto';

import jwt, { type JwtPayload } from 'jsonwebtoken';
import { type Context } from 'koa';
import { literal, Op } from 'sequelize';

import { EmailAuthorization, OAuthAuthorization, Organization, User } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { createJWTResponse } from '../utils/createJWTResponse.js';

export async function getUser(ctx: Context): Promise<void> {
  const { user } = ctx;

  await (user as User).reload({
    include: [
      {
        model: Organization,
        attributes: {
          include: ['id', 'name', 'updated', [literal('icon IS NOT NULL'), 'hasIcon']],
          exclude: ['icon'],
        },
      },
      {
        model: EmailAuthorization,
      },
    ],
  });

  ctx.body = {
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    organizations: (user as User).Organizations.map((org: Organization) => ({
      id: org.id,
      name: org.name,
      iconUrl: org.get('hasIcon')
        ? `/api/organizations/${org.id}/icon?updated=${org.updated.toISOString()}`
        : null,
    })),
    emails: user.EmailAuthorizations.map(
      ({ email, verified }: { email: string; verified: boolean }) => ({
        email,
        verified,
        primary: user.primaryEmail === email,
      }),
    ),
    locale: user.locale,
    timezone: user.timezone,
  };
}

export async function getUserOrganizations(ctx: Context): Promise<void> {
  const { user } = ctx;

  const organizations = await Organization.findAll({
    attributes: [
      'id',
      'name',
      'description',
      'website',
      'email',
      'updated',
      [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
    ],
    include: [{ model: User, where: { id: user.id } }],
  });

  ctx.body = organizations.map((org: Organization) => ({
    id: org.id,
    name: org.name,
    role: org.Users[0].Member.role,
    description: org.description,
    website: org.website,
    email: org.email,
    iconUrl: org.get('hasIcon')
      ? `/api/organizations/${org.id}/icon?updated=${org.updated.toISOString()}`
      : null,
  }));
}

export async function updateUser(ctx: Context): Promise<void> {
  const {
    request: {
      body: { locale, name, timezone },
    },
    user,
  } = ctx;
  const email = ctx.request.body.email?.toLowerCase();

  const dbUser = await User.findOne({
    where: { id: user.id },
    include: [
      {
        model: EmailAuthorization,
      },
    ],
  });

  if (email && email !== dbUser.primaryEmail) {
    const emailAuth = await EmailAuthorization.findOne({
      where: { email },
    });

    if (!emailAuth) {
      ctx.response.status = 404;
      ctx.response.body = {
        statusCode: 404,
        error: 'Not Found',
        message: 'No matching email could be found.',
      };
      ctx.throw();
    }

    if (!emailAuth.verified) {
      ctx.response.status = 406;
      ctx.response.body = {
        statusCode: 406,
        error: 'Not Acceptable',
        message: 'This email address has not been verified.',
      };
      ctx.throw();
    }
  }

  await dbUser.update({ name, primaryEmail: email, locale, timezone });

  ctx.body = {
    id: dbUser.id,
    name,
    email,
    email_verified: true,
    locale: dbUser.locale,
  };
}

export async function listEmails(ctx: Context): Promise<void> {
  const { user } = ctx;

  ctx.body = await EmailAuthorization.findAll({
    attributes: ['email', 'verified'],
    order: ['email'],
    raw: true,
    where: { UserId: user.id },
  });
}

export async function addEmail(ctx: Context): Promise<void> {
  const { mailer, request, user } = ctx;

  const email = request.body.email.toLowerCase();
  const dbEmail = await EmailAuthorization.findOne({
    where: { email },
  });

  if (dbEmail) {
    ctx.response.status = 409;
    ctx.response.body = {
      statusCode: 409,
      error: 'Conflict',
      message: 'This email has already been registered.',
    };
    ctx.throw();
  }

  await (user as User).reload({
    include: [
      {
        model: EmailAuthorization,
      },
    ],
  });

  const key = randomBytes(40).toString('hex');
  await EmailAuthorization.create({ UserId: user.id, email, key });

  await mailer.sendTemplateEmail({ email, name: user.name }, 'emailAdded', {
    url: `${argv.host}/verify?token=${key}`,
  });

  ctx.status = 201;
  ctx.body = {
    email,
    verified: false,
  };
}

export async function removeEmail(ctx: Context): Promise<void> {
  const { request, user } = ctx;

  const email = request.body.email.toLowerCase();
  await (user as User).reload({
    include: [
      {
        model: EmailAuthorization,
      },
      {
        model: OAuthAuthorization,
      },
    ],
  });

  const dbEmail = await EmailAuthorization.findOne({ where: { email, UserId: user.id } });

  if (!dbEmail) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'This email address is not associated with your account.',
    };
    ctx.throw();
  }

  if (user.EmailAuthorizations.length === 1 && !(user as User).OAuthAuthorizations.length) {
    ctx.response.status = 406;
    ctx.response.body = {
      statusCode: 406,
      error: 'Not Acceptable',
      message: 'Deleting this email results in the inability to access this account.',
    };
    ctx.throw();
  }

  await dbEmail.destroy();

  ctx.status = 204;
}

export function emailLogin(ctx: Context): void {
  const { user } = ctx;

  ctx.body = createJWTResponse(user.id);
}

export function refreshToken(ctx: Context): void {
  const {
    request: { body },
  } = ctx;
  let sub: string;
  try {
    ({ sub } = jwt.verify(body.refresh_token, argv.secret, { audience: argv.host }) as JwtPayload);
  } catch {
    ctx.response.status = 401;
    ctx.response.body = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid refresh token',
    };
    ctx.throw();
  }

  ctx.body = createJWTResponse(sub);
}

export async function getSubscribedUsers(ctx: Context): Promise<void> {
  const {
    request: {
      headers: { authorization },
    },
  } = ctx;

  if (authorization !== `Bearer ${argv.adminApiSecret}` || !argv.adminApiSecret) {
    ctx.response.status = 401;
    ctx.response.body = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or missing admin API secret',
    };
    ctx.throw();
  }
  const users = await User.findAll({
    include: {
      model: EmailAuthorization,
      where: { verified: true },
    },
    where: { deleted: null, subscribed: { [Op.eq]: true } },
  });
  const res = users.map((user) => ({
    email: user.primaryEmail,
    name: user.name,
    locale: user.locale,
  }));

  ctx.body = res;
}

export async function unsubscribe(ctx: Context): Promise<void> {
  const {
    request: {
      body: { email },
      headers: { authorization },
    },
  } = ctx;

  if (authorization !== `Bearer ${argv.adminApiSecret}` || !argv.adminApiSecret) {
    ctx.response.status = 401;
    ctx.response.body = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or missing admin API secret',
    };
    ctx.throw();
  }
  const user = await User.findOne({ where: { primaryEmail: email } });
  if (!user.subscribed) {
    ctx.body = 'User is already unsubscribed';
    return;
  }

  user.subscribed = false;
  await user.save();

  ctx.body = `User with email ${user.primaryEmail} unsubscribed successfully`;
}
