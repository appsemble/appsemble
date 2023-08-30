import { randomBytes } from 'node:crypto';

import type * as types from '@appsemble/types';
import { addMinutes } from 'date-fns';
import { type Context } from 'koa';

import { argv } from './argv.js';
import * as models from '../models/index.js';

/**
 * Resolves the icon url for an app based on whether it’s present and when it was updated.
 *
 * @param app The app to resolve the icon url for.
 * @returns A URL that can be safely cached.
 */
export function resolveIconUrl(app: models.App): string {
  const hasIcon = app.get('hasIcon') ?? Boolean(app.icon);

  if (hasIcon) {
    return `/api/apps/${app.id}/icon?${new URLSearchParams({
      maskable: 'true',
      updated: app.updated.toISOString(),
    })}`;
  }

  const organizationHasIcon = app.Organization?.get('hasIcon');
  if (organizationHasIcon) {
    return `/api/organizations/${app.OrganizationId}/icon?${new URLSearchParams({
      background: app.iconBackground || '#ffffff',
      maskable: 'true',
      updated: app.Organization.updated.toISOString(),
    })}`;
  }

  return null;
}

export async function createOAuth2AuthorizationCode(
  app: models.App,
  redirectUri: string,
  scope: string,
  user: models.User,
  ctx: Context,
): Promise<types.OAuth2AuthorizationCode> {
  const appHost = `${app.path}.${app.OrganizationId}.${new URL(argv.host).hostname}`;
  const redirectHost = new URL(redirectUri).hostname;
  if (redirectHost !== appHost && redirectHost !== app.domain) {
    ctx.response.status = 403;
    ctx.response.body = {
      statusCode: 403,
      error: 'Forbidden',
      message: 'Invalid redirectUri',
    };
    ctx.throw();
  }

  const { code } = await models.OAuth2AuthorizationCode.create({
    AppId: app.id,
    code: randomBytes(12).toString('hex'),
    expires: addMinutes(new Date(), 10),
    redirectUri,
    scope,
    UserId: user.id,
  });
  return {
    code,
  };
}
