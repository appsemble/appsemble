import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';

export async function updateAppSslSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { certificate, key },
    },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['domain', 'id', 'OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await app.update({
    sslCertificate: certificate?.trim() || null,
    sslKey: key?.trim() || null,
  });

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppSecrets],
  });

  ctx.body = {
    certificate: app.sslCertificate,
    key: app.sslKey,
  };
}
