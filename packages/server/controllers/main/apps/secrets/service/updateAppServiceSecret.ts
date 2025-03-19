import { assertKoaCondition, updateNamespacedSecret } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppServiceSecret } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';
import { encrypt } from '../../../../../utils/crypto.js';

export async function updateAppServiceSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, serviceSecretId },
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
    requiredPermissions: [OrganizationPermission.UpdateAppSecrets],
  });

  const appServiceSecret = await AppServiceSecret.findByPk(serviceSecretId);
  assertKoaCondition(
    appServiceSecret != null,
    ctx,
    404,
    'Cannot find the app service secret to update',
  );

  await appServiceSecret.update({
    ...body,
    secret: encrypt(body.secret, argv.aesSecret),
    AppId: appId,
  });

  const { authenticationMethod, ca, id, identifier, name, scope, tokenUrl, urlPatterns } =
    appServiceSecret;

  await updateNamespacedSecret(name, body.secret, app.path, String(appId));

  ctx.body = {
    authenticationMethod,
    id,
    name,
    identifier,
    urlPatterns,
    tokenUrl,
    scope,
    ca,
  };
}
