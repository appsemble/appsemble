import { logger } from '@appsemble/node-utils';
import Boom from '@hapi/boom';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { isPast, parseISO } from 'date-fns';
import { Op, UniqueConstraintError } from 'sequelize';

import createJWTResponse from '../utils/createJWTResponse';

export async function registerOAuth2ClientCredentials(ctx) {
  const { OAuth2ClientCredentials } = ctx.db.models;
  const { body } = ctx.request;
  const { user } = ctx.state;

  const expires = parseISO(body.expires);
  if (isPast(expires)) {
    throw Boom.badRequest('These credentials have already expired');
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

export async function listOAuth2ClientCredentials(ctx) {
  const { OAuth2ClientCredentials } = ctx.db.models;
  const { user } = ctx.state;

  const credentials = await OAuth2ClientCredentials.findAll({
    attributes: ['created', 'description', 'id', 'expires', 'scopes'],
    raw: true,
    where: {
      expires: { [Op.gt]: new Date() },
      UserId: user.id,
    },
  });

  ctx.body = credentials.map(({ scopes, ...cred }) => ({
    ...cred,
    scopes: scopes.split(' '),
  }));
}

export async function deleteOAuth2ClientCredentials(ctx) {
  const { OAuth2ClientCredentials } = ctx.db.models;
  const { clientId } = ctx.params;
  const { user } = ctx.state;

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

export async function getPendingOAuth2Profile(ctx) {
  const { OAuthAuthorization } = ctx.db.models;
  const { state } = ctx.query;

  const authorization = await OAuthAuthorization.findOne({
    attributes: ['accessToken'],
    where: { state },
  });

  if (!authorization) {
    throw Boom.notFound('No pending OAuth authorization found for given state');
  }

  const { data: userinfo } = await axios.get('https://gitlab.com/oauth/userinfo', {
    headers: { authorization: `Bearer ${authorization.accessToken}` },
  });
  ctx.body = {
    email: userinfo.email,
    name: userinfo.name,
    picture: userinfo.picture,
    profile: userinfo.profile,
  };
}

export async function connectPendingOAuth2Profile(ctx) {
  const { argv } = ctx;
  const { OAuthAuthorization } = ctx.db.models;
  const { state } = ctx.request.body;
  let { user } = ctx.state;

  const authorization = await OAuthAuthorization.findOne({
    where: { state },
  });

  if (!authorization) {
    throw Boom.notFound('No pending OAuth authorization found for given state');
  }

  if (!user) {
    const { data: userinfo } = await axios.get('https://gitlab.com/oauth/userinfo', {
      headers: { authorization: `Bearer ${authorization.accessToken}` },
    });
    user = await authorization.createUser({
      name: userinfo.name,
    });
    if (userinfo.email) {
      try {
        await user.createEmailAuthorization({
          email: userinfo.email,
          verified: userinfo.email_verified,
        });
      } catch (err) {
        if (!(err instanceof UniqueConstraintError)) {
          throw err;
        }
        logger.warn(
          `Couldn’t register duplicate email authorization for user ${user.id} and email address ${userinfo.email}`,
        );
      }
    }
  }
  ctx.body = createJWTResponse(state.user.id, argv);
}
