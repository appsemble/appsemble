import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { DEFAULT_SAML_EMAIL_ATTRIBUTE } from '../../../../../models/AppSamlSecret.js';
import { App, AppSamlSecret } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';

export async function updateAppSamlSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appSamlSecretId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: [{ model: AppSamlSecret, required: false, where: { id: appSamlSecretId } }],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppSecrets],
  });

  const [secret] = app.AppSamlSecrets;
  assertKoaCondition(secret != null, ctx, 404, 'SAML secret not found');

  ctx.body = await secret.update({
    ...body,
    emailAttribute: body.emailAttribute || DEFAULT_SAML_EMAIL_ATTRIBUTE,
  });
}
