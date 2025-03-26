import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { encrypt } from '../../../../../utils/crypto.js';

export async function updateAppScimSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id', 'OrganizationId', 'scimEnabled', 'scimToken'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppSecrets],
  });

  ctx.assert(app, 404, 'App not found');

  const updates: Partial<Pick<App, 'scimEnabled' | 'scimToken'>> = {};
  if ('enabled' in body) {
    updates.scimEnabled = body.enabled;
  }
  if ('token' in body) {
    updates.scimToken = encrypt(body.token, argv.aesSecret) || null;
  }

  await app.update(updates);

  ctx.body = {
    enabled: app.scimEnabled,
    token: body.token || null,
  };
}
