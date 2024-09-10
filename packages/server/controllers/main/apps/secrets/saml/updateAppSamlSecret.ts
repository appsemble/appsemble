import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppSamlSecret } from '../../../../../models/index.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';
import { checkRole } from '../../../../../utils/checkRole.js';

export async function updateAppSamlSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appSamlSecretId },
    request: {
      body: {
        emailAttribute,
        entityId,
        icon,
        idpCertificate,
        name,
        nameAttribute,
        objectIdAttribute,
        ssoUrl,
      },
    },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret, required: false, where: { id: appSamlSecretId } }],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);
  await checkRole(ctx, app.OrganizationId, [Permission.EditApps, Permission.EditAppSettings]);

  const [secret] = app.AppSamlSecrets;
  assertKoaError(!secret, ctx, 404, 'SAML secret not found');

  ctx.body = await secret.update({
    emailAttribute,
    entityId,
    icon,
    idpCertificate,
    name,
    nameAttribute,
    objectIdAttribute,
    ssoUrl,
  });
}
