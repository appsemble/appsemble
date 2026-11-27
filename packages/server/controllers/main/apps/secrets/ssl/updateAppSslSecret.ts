import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { isSecretIncomplete } from '../../../../../utils/secrets.js';

export async function updateAppSslSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { certificate, key },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['domain', 'id', 'OrganizationId', 'sslCertificate', 'sslKey'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppSecrets],
  });

  await app.update({
    sslCertificate: certificate?.trim() || null,
    ...(key === undefined ? {} : { sslKey: key.trim() || null }),
  });

  ctx.body = {
    certificate: app.sslCertificate,
    incomplete: isSecretIncomplete(app.sslKey),
  };
}
