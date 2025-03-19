import { assertKoaCondition, updateNamespacedSecret } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppServiceSecret } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';
import { encrypt } from '../../../../../utils/crypto.js';

export async function createAppServiceSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'path'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateAppSecrets],
  });

  const { authenticationMethod, ca, id, identifier, name, scope, tokenUrl, urlPatterns } =
    await AppServiceSecret.create({
      ...body,
      secret: encrypt(body.secret, argv.aesSecret),
      AppId: appId,
    });

  // Create in the cluster
  await updateNamespacedSecret(name, body.secret, app.path, String(appId));

  ctx.body = {
    authenticationMethod,
    id,
    identifier,
    name,
    urlPatterns,
    tokenUrl,
    scope,
    ca,
  };
}
