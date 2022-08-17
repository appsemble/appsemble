import { randomBytes } from 'crypto';

import { badRequest, notFound } from '@hapi/boom';
import { hash } from 'bcrypt';
import { isPast, parseISO } from 'date-fns';
import { Context } from 'koa';
import { Op } from 'sequelize';

import { OAuth2ClientCredentials } from '../models/index.js';

export async function registerOAuth2ClientCredentials(ctx: Context): Promise<void> {
  const {
    request: { body },
    user,
  } = ctx;

  let expires;
  if (body.expires) {
    expires = parseISO(body.expires);
    if (isPast(expires)) {
      throw badRequest('These credentials have already expired');
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
    secret: await hash(secret, 10),
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

export async function listOAuth2ClientCredentials(ctx: Context): Promise<void> {
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

export async function deleteOAuth2ClientCredentials(ctx: Context): Promise<void> {
  const {
    pathParams: { clientId },
    user,
  } = ctx;

  const affectedRows = await OAuth2ClientCredentials.destroy({
    where: {
      id: clientId,
      UserId: user.id,
    },
  });

  if (!affectedRows) {
    throw notFound('No client credentials found for the given client id');
  }
}
