import { getAppRoles } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { DEFAULT_SAML_EMAIL_ATTRIBUTE } from '../../../../../models/apps/AppSamlSecret.js';
import { App, getAppDB } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';
import {
  normalizeLoginRoleMappings,
  validateLoginRoleMappings,
} from '../../../../../utils/loginRoleMappings.js';

export async function updateAppSamlSecret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appSamlSecretId },
    request: { body },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['OrganizationId', 'definition'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  const { AppSamlSecret } = await getAppDB(appId);
  const appSamlSecret = await AppSamlSecret.findByPk(appSamlSecretId);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppSecrets],
  });

  assertKoaCondition(appSamlSecret != null, ctx, 404, 'SAML secret not found');

  const roleMappingsError = validateLoginRoleMappings(
    body.roleMappings,
    getAppRoles(app.definition.security),
  );
  const roleMappings = normalizeLoginRoleMappings(body.roleMappings);
  const groupAttribute = body.groupAttribute?.trim() || undefined;

  assertKoaCondition(
    roleMappingsError == null,
    ctx,
    400,
    roleMappingsError || 'Invalid role mappings',
  );
  assertKoaCondition(
    !roleMappings || Boolean(groupAttribute),
    ctx,
    400,
    'Group attribute is required when role mappings are configured',
  );

  ctx.body = await appSamlSecret.update({
    ...body,
    emailAttribute: body.emailAttribute || DEFAULT_SAML_EMAIL_ATTRIBUTE,
    groupAttribute: groupAttribute ?? null,
    roleMappings: roleMappings ?? null,
  });
}
