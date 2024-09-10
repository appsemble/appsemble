import { assertKoaError, updateNamespacedSecret } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppServiceSecret } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';
import { checkRole } from '../../../../../utils/checkRole.js';
import { encrypt } from '../../../../../utils/crypto.js';

export async function createAppServiceSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'path'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permissions.EditApps, Permissions.EditAppSettings]);

  const { authenticationMethod, id, identifier, name, tokenUrl, urlPatterns } =
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
  };
}
