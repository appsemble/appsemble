import { randomBytes } from 'node:crypto';

import { throwKoaError } from '@appsemble/node-utils';
import { hash } from 'bcrypt';
import { isPast, parseISO } from 'date-fns';
import { type Context } from 'koa';

import { OAuth2ClientCredentials } from '../../../../../../../models/index.js';

export async function registerCurrentUserOAuth2ClientCredentials(ctx: Context): Promise<void> {
  const {
    request: { body },
  } = ctx;
  const user = ctx.user!;

  let expires;
  if (body.expires) {
    expires = parseISO(body.expires);
    if (isPast(expires)) {
      throwKoaError(ctx, 400, 'These credentials have already expired');
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
