import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App } from '../../../../../models/index.js';
import { checkUserPermissions } from '../../../../../utils/authorization.js';

export async function updateAppSslSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { certificate, key },
    },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['domain', 'id', 'OrganizationId'] });
  assertKoaError(!app, ctx, 404, 'App not found');

  await app.update({
    sslCertificate: certificate?.trim() || null,
    sslKey: key?.trim() || null,
  });

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.UpdateAppSecrets]);

  ctx.body = {
    certificate: app.sslCertificate,
    key: app.sslKey,
  };
}
