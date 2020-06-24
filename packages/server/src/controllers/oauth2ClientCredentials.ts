import Boom from '@hapi/boom';
import { randomBytes } from 'crypto';
import { isPast, parseISO } from 'date-fns';
import { Op } from 'sequelize';

import { OAuth2ClientCredentials } from '../models';
import type { KoaContext } from '../types';

interface Params {
  clientId: string;
}

export async function registerOAuth2ClientCredentials(ctx: KoaContext): Promise<void> {
  const {
    request: { body },
    user,
  } = ctx;

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
  const {
    params: { clientId },
    user,
  } = ctx;

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
