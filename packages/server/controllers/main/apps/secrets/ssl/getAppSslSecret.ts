import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { isSecretIncomplete } from '../../../../../utils/secrets.js';

export async function getAppSslSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'sslCertificate', 'sslKey'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryAppSecrets],
  });

  ctx.body = {
    certificate: app.sslCertificate,
    incomplete: isSecretIncomplete(app.sslKey),
  };
}
