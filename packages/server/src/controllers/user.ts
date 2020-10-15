import { randomBytes } from 'crypto';

import type { JwtPayload } from '@appsemble/types';
import { conflict, notAcceptable, notFound } from '@hapi/boom';
import { verify } from 'jsonwebtoken';

import { EmailAuthorization, OAuthAuthorization, Organization, User } from '../models';
import type { KoaContext } from '../types';
import { createJWTResponse } from '../utils/createJWTResponse';

export async function getUser(ctx: KoaContext): Promise<void> {
  const { user } = ctx;

  const dbUser = await User.findOne({
    where: { id: user.id },
    include: [
      {
        model: Organization,
        attributes: ['id', 'name'],
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
    organizations: dbUser.Organizations.map(({ id, name }) => ({
      id,
      name,
      iconUrl: `/api/organizations/${id}/icon`,
    })),
    emails: dbUser.EmailAuthorizations.map(({ email, verified }) => ({
      email,
      verified,
      primary: dbUser.primaryEmail === email,
    })),
  };
}

export async function getUserOrganizations(ctx: KoaContext): Promise<void> {
  const { user } = ctx;

  const dbUser = await User.findOne({
    where: { id: user.id },
    include: [
      {
        model: Organization,
        attributes: ['id', 'name'],
      },
    ],
  });

  ctx.body = dbUser.Organizations.map((org) => ({
    id: org.id,
    name: org.name,
    role: org.Member.role,
    iconUrl: `/api/organizations/${org.id}/icon`,
  }));
}

export async function updateUser(ctx: KoaContext): Promise<void> {
  const {
    request: {
      body: { email, name },
    },
    user,
  } = ctx;

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

  await dbUser.update({ name, primaryEmail: email });

  ctx.body = {
    id: dbUser.id,
    name,
    email,
    email_verified: true,
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
  const {
    argv: { host },
    mailer,
    request: {
      body: { email },
    },
    user,
  } = ctx;

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
    url: `${host}/verify?token=${key}`,
  });

  ctx.status = 201;
  ctx.body = {
    email,
    verified: false,
  };
}

export async function removeEmail(ctx: KoaContext): Promise<void> {
  const {
    request: {
      body: { email },
    },
    user,
  } = ctx;

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
  const { argv, user } = ctx;

  ctx.body = createJWTResponse(user.id, argv);
}

export function refreshToken(ctx: KoaContext): void {
  const {
    argv,
    request: { body },
  } = ctx;
  const { sub } = verify(body.refresh_token, argv.secret, { audience: argv.host }) as JwtPayload;

  ctx.body = createJWTResponse(sub, argv);
}
