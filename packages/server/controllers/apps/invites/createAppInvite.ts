import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';

export async function createAppInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'path', 'OrganizationId', 'domain'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  assertKoaError(!app.definition.security, ctx, 400, 'App does not have a security definition.');

  // TODO
}
