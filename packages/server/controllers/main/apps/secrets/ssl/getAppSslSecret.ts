import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App } from '../../../../../models/index.js';
import { checkUserPermissions } from '../../../../../utils/authorization.js';

export async function getAppSslSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'sslCertificate', 'sslKey'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.QueryAppSecrets]);

  ctx.body = {
    key: app.sslKey,
    certificate: app.sslCertificate,
  };
}
