import { randomBytes } from 'crypto';

import { conflict, notAcceptable, notFound } from '@hapi/boom';
import { JwtPayload, verify } from 'jsonwebtoken';
import { literal } from 'sequelize';

import { EmailAuthorization, OAuthAuthorization, Organization, User } from '../models';
import { KoaContext } from '../types';
import { argv } from '../utils/argv';
import { createJWTResponse } from '../utils/createJWTResponse';

export async function getUser(ctx: KoaContext): Promise<void> {
  const { user } = ctx;

  const dbUser = await User.findOne({
    where: { id: user.id },
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
    id: dbUser.id,
    name: dbUser.name,
    primaryEmail: dbUser.primaryEmail,
    organizations: dbUser.Organizations.map((org) => ({
      id: org.id,
      name: org.name,
      iconUrl: org.get('hasIcon')
        ? `/api/organizations/${org.id}/icon?updated=${org.updated.toISOString()}`
        : null,
    })),
    emails: dbUser.EmailAuthorizations.map(({ email, verified }) => ({
      email,
      verified,
      primary: dbUser.primaryEmail === email,
    })),
    locale: dbUser.locale,
  };
}

export async function getUserOrganizations(ctx: KoaContext): Promise<void> {
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

  ctx.body = organizations.map((org) => ({
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

export async function updateUser(ctx: KoaContext): Promise<void> {
  const {
    request: {
      body: { locale, name },
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
      throw notFound('No matching email could be found.');
    }

    if (!emailAuth.verified) {
      throw notAcceptable('This email address has not been verified.');
    }
  }

  await dbUser.update({ name, primaryEmail: email, locale });

  ctx.body = {
    id: dbUser.id,
    name,
    email,
    email_verified: true,
    locale: dbUser.locale,
  };
}

export async function listEmails(ctx: KoaContext): Promise<void> {
  const { user } = ctx;

  ctx.body = await EmailAuthorization.findAll({
    attributes: ['email', 'verified'],
    order: ['email'],
    raw: true,
    where: { UserId: user.id },
  });
}

export async function addEmail(ctx: KoaContext): Promise<void> {
  const { mailer, request, user } = ctx;

  const email = request.body.email.toLowerCase();
  const dbEmail = await EmailAuthorization.findOne({
    where: { email },
  });

  if (dbEmail) {
    throw conflict('This email has already been registered.');
  }

  const dbUser = await User.findOne({
    where: { id: user.id },
    include: [
      {
        model: EmailAuthorization,
      },
    ],
  });

  const key = randomBytes(40).toString('hex');
  await EmailAuthorization.create({ UserId: user.id, email, key });

  await mailer.sendTemplateEmail({ email, name: dbUser.name }, 'emailAdded', {
    url: `${argv.host}/verify?token=${key}`,
  });

  ctx.status = 201;
  ctx.body = {
    email,
    verified: false,
  };
}

export async function removeEmail(ctx: KoaContext): Promise<void> {
  const { request, user } = ctx;

  const email = request.body.email.toLowerCase();
  const dbUser = await User.findOne({
    where: { id: user.id },
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
    throw notFound('This email address is not associated with your account.');
  }

  if (dbUser.EmailAuthorizations.length === 1 && !dbUser.OAuthAuthorizations.length) {
    throw notAcceptable('Deleting this email results in the inability to access this account.');
  }

  await dbEmail.destroy();

  ctx.status = 204;
}

export function emailLogin(ctx: KoaContext): void {
  const { user } = ctx;

  ctx.body = createJWTResponse(user.id);
}

export function refreshToken(ctx: KoaContext): void {
  const {
    request: { body },
  } = ctx;
  const { sub } = verify(body.refresh_token, argv.secret, { audience: argv.host }) as JwtPayload;

  ctx.body = createJWTResponse(sub);
}
