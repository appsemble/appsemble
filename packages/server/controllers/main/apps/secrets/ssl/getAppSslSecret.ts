import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';

export async function getAppSslSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'sslCertificate', 'sslKey'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions(ctx, app.OrganizationId, [
    OrganizationPermission.QueryAppSecrets,
  ]);

  ctx.body = {
    key: app.sslKey,
    certificate: app.sslCertificate,
  };
}
