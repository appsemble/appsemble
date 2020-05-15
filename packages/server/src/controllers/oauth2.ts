import { logger } from '@appsemble/node-utils';
import Boom from '@hapi/boom';
import { randomBytes } from 'crypto';
import { isPast, parseISO } from 'date-fns';
import { Op, UniqueConstraintError } from 'sequelize';

import { EmailAuthorization, OAuth2ClientCredentials, OAuthAuthorization } from '../models';
import type { KoaContext } from '../types';
import createJWTResponse from '../utils/createJWTResponse';
import getUserInfo from '../utils/getUserInfo';

interface Params {
  clientId: string;
}

export async function registerOAuth2ClientCredentials(ctx: KoaContext): Promise<void> {
  const { body } = ctx.request;
  const { user } = ctx;

  let expires;
  if (body.expires) {
    expires = parseISO(body.expires);
    if (isPast(expires)) {
      throw Boom.badRequest('These credentials have already expired');
    }
  }
  const scopes = body.scopes.sort().join(' ');
  const id = randomBytes(16).toString('hex');
  const secret = randomBytes(32).toString('hex');

  const credentials = await OAuth2ClientCredentials.create({
    description: body.description,
    expires,
    id,
    scopes,
    secret,
    UserId: user.id,
  });

  ctx.body = {
    created: credentials.created,
    description: credentials.description,
    id,
    expires,
    scopes: scopes.split(' '),
    secret,
  };
}

export async function listOAuth2ClientCredentials(ctx: KoaContext): Promise<void> {
  const { user } = ctx;

  const credentials = await OAuth2ClientCredentials.findAll({
    attributes: ['created', 'description', 'id', 'expires', 'scopes'],
    raw: true,
    where: {
      expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
      UserId: user.id,
    },
  });

  ctx.body = credentials.map(({ scopes, ...cred }) => ({
    ...cred,
    scopes: scopes.split(' '),
  }));
}

export async function deleteOAuth2ClientCredentials(ctx: KoaContext<Params>): Promise<void> {
  const { clientId } = ctx.params;
  const { user } = ctx;

  const affectedRows = await OAuth2ClientCredentials.destroy({
    where: {
      id: clientId,
      UserId: user.id,
    },
  });

  if (!affectedRows) {
    throw Boom.notFound('No client credentials found for the given client id');
  }
}

export async function getPendingOAuth2Profile(ctx: KoaContext): Promise<void> {
  const { code, provider } = ctx.query;

  const authorization = await OAuthAuthorization.findOne({
    attributes: ['token', 'UserId'],
    where: { code, provider },
  });

  if (!authorization) {
    throw Boom.notFound('No pending OAuth authorization found for given state');
  }

  if (authorization.UserId != null) {
    ctx.body = createJWTResponse(authorization.UserId, ctx.argv);
    return;
  }

  const userInfo = await getUserInfo(provider, authorization.token);
  ctx.body = {
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture,
    profile: userInfo.profile,
  };
}

export async function connectPendingOAuth2Profile(ctx: KoaContext): Promise<void> {
  const { argv } = ctx;
  const { code, provider } = ctx.request.body;
  let { user } = ctx;

  const authorization = await OAuthAuthorization.findOne({
    where: { code, provider },
  });

  if (!authorization) {
    throw Boom.notFound('No pending OAuth2 authorization found for given state');
  }

  // The user is already logged in to Appsemble.
  if (user) {
    // The OAuth2 authorization is not yet linked to a user, so we link it to the authenticated
    // user. From now on the user will be able to login to this account using this OAuth2 provider.
    if (!authorization.UserId) {
      await authorization.update({
        UserId: user.id,
      });
    }

    // The authorization is already linked to another account, so we disallow linking it again.
    if (authorization.UserId !== user.id) {
      throw Boom.forbidden('This OAuth2 authorization is already linked to an account.');
    }
  }
  // The user is not yet logged in, so they are trying to register a new account using this OAuth2
  // provider.
  else {
    const userInfo = await getUserInfo(provider, authorization.token);
    const dbUser = await authorization.createUser({
      name: userInfo.name,
    });
    if (userInfo.email) {
      try {
        // We’ll try to link this email address to the new user, even though no password has been
        // set.
        await EmailAuthorization.create({
          UserId: user.id,
          email: userInfo.email,
          verified: userInfo.email_verified,
        });
        await dbUser.update({
          primaryEmail: userInfo.email,
        });
      } catch (err) {
        if (!(err instanceof UniqueConstraintError)) {
          throw err;
        }
        // However, the email may have been linked to another account.
        logger.warn(
          `Couldn’t register duplicate email authorization for user ${user.id} and email address ${userInfo.email}`,
        );
      }
    }
    user = dbUser;
  }
  ctx.body = createJWTResponse(user.id, argv);
}
