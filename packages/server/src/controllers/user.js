import Boom from '@hapi/boom';
import crypto from 'crypto';
import { verify } from 'jsonwebtoken';

import createJWTResponse from '../utils/createJWTResponse';

export async function getUser(ctx) {
  const { EmailAuthorization, Organization, User } = ctx.db.models;
  const { user } = ctx.state;

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
    organizations: dbUser.Organizations.map(({ id, name }) => ({ id, name })),
    emails: dbUser.EmailAuthorizations.map(({ email, verified }) => ({
      email,
      verified,
      primary: dbUser.primaryEmail === email,
    })),
  };
}

export async function getUserOrganizations(ctx) {
  const { Organization, User } = ctx.db.models;
  const { user } = ctx.state;

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
  }));
}

export async function updateUser(ctx) {
  const { EmailAuthorization, User } = ctx.db.models;
  const { user } = ctx.state;
  const { email, name } = ctx.request.body;

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
      throw Boom.notFound('No matching email could be found.');
    }

    if (!emailAuth.verified) {
      throw Boom.notAcceptable('This email address has not been verified.');
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

export async function listEmails(ctx) {
  const { EmailAuthorization } = ctx.db.models;
  const { user } = ctx.state;

  ctx.body = await EmailAuthorization.findAll({
    attributes: ['email', 'verified'],
    order: ['email'],
    raw: true,
    where: { UserId: user.id },
  });
}

export async function addEmail(ctx) {
  const { mailer } = ctx;
  const { EmailAuthorization, User } = ctx.db.models;
  const { user } = ctx.state;
  const { email } = ctx.request.body;

  const dbEmail = await EmailAuthorization.findOne({
    where: { email },
  });

  if (dbEmail) {
    throw Boom.conflict('This email has already been registered.');
  }

  const dbUser = await User.findOne({
    where: { id: user.id },
    include: [
      {
        model: EmailAuthorization,
      },
    ],
  });

  const key = crypto.randomBytes(40).toString('hex');
  await dbUser.createEmailAuthorization({ email, key });

  await mailer.sendEmail({ email, name: dbUser.name }, 'emailAdded', {
    url: `${ctx.origin}/verify?token=${key}`,
  });

  ctx.status = 201;
  ctx.body = {
    email,
    verified: false,
  };
}

export async function removeEmail(ctx) {
  const { EmailAuthorization, OAuthAuthorization, User } = ctx.db.models;
  const { user } = ctx.state;
  const { email } = ctx.request.body;

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
    throw Boom.notFound('This email address is not associated with your account.');
  }

  if (dbUser.EmailAuthorizations.length === 1 && !dbUser.OAuthAuthorizations.length) {
    throw Boom.notAcceptable(
      'Deleting this email results in the inability to access this account.',
    );
  }

  await dbUser.removeEmailAuthorizations(dbEmail);
  await dbEmail.destroy();

  ctx.status = 204;
}

export async function emailLogin(ctx) {
  const { argv, state } = ctx;

  ctx.body = createJWTResponse(state.user.id, argv);
}

export async function refreshToken(ctx) {
  const { argv } = ctx;
  const token = ctx.request.body.refresh_token;
  const { sub } = verify(token, argv.secret, { aud: argv.host });

  ctx.body = createJWTResponse(sub, argv);
}
