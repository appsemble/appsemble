import Boom from '@hapi/boom';
import crypto from 'crypto';
import { addMinutes } from 'date-fns';
import { Op } from 'sequelize';
import { URL } from 'url';

import { App, EmailAuthorization, OAuth2AuthorizationCode, User } from '../models';
import type { KoaContext } from '../types';

interface Params {
  appId: number;
  redirectUri: string;
}

export async function getUserInfo(ctx: KoaContext<Params>): Promise<void> {
  const {
    user: { id },
  } = ctx;

  const user = await User.findOne({
    attributes: ['primaryEmail', 'name'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
    where: { id },
  });

  if (!user) {
    // The authenticated user may have been deleted.
    throw Boom.forbidden();
  }

  const picture = user.primaryEmail
    ? `https://www.gravatar.com/avatar/${crypto
        .createHash('md5')
        .update(user.primaryEmail.toLowerCase())
        .digest('hex')}?s=128&d=mp`
    : null;

  ctx.body = {
    email: user.primaryEmail,
    email_verified: user.primaryEmail ? user.EmailAuthorizations[0].verified : false,
    name: user.name,
    picture,
    sub: id,
  };
}

export async function createAuthorizationCode(ctx: KoaContext<Params>): Promise<void> {
  const {
    argv: { host },
    request: {
      body: { appId, redirectUri, scope },
    },
    user: { id },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['domain', 'path', 'OrganizationId'] });

  if (!app) {
    throw Boom.notFound('App not found');
  }

  const appHost = `${app.path}.${app.OrganizationId}.${new URL(host).hostname}`;
  const redirectHost = new URL(redirectUri).hostname;
  if (redirectHost !== appHost && redirectHost !== app.domain) {
    throw Boom.forbidden('Invalid redirectUri');
  }

  const { code } = await OAuth2AuthorizationCode.create({
    AppId: appId,
    code: crypto.randomBytes(12).toString('hex'),
    expires: addMinutes(new Date(), 10),
    redirectUri,
    scope,
    UserId: id,
  });
  ctx.body = {
    code,
  };
}
