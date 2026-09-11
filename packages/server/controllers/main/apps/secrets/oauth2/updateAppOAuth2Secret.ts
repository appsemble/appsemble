import { getAppRoles } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../../models/index.js';
import { touchApp } from '../../../../../utils/app.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import {
  normalizeLoginRoleMappings,
  validateLoginRoleMappings,
} from '../../../../../utils/loginRoleMappings.js';

export async function updateAppOAuth2Secret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appOAuth2SecretId },
    request: {
      body: { id, ...body },
    },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['OrganizationId', 'definition'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { AppOAuth2Secret } = await getAppDB(appId);
  const appOAuth2Secret = await AppOAuth2Secret.findByPk(appOAuth2SecretId);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppSecrets],
  });

  assertKoaCondition(appOAuth2Secret != null, ctx, 404, 'OAuth2 secret not found');

  const roleMappingsError = validateLoginRoleMappings(
    body.roleMappings,
    getAppRoles(app.definition.security),
  );
  assertKoaCondition(
    roleMappingsError == null,
    ctx,
    400,
    roleMappingsError || 'Invalid role mappings',
  );

  ctx.body = await appOAuth2Secret.update({
    ...body,
    roleMappings: normalizeLoginRoleMappings(body.roleMappings) ?? null,
    userInfoUrl: body.userInfoUrl || null,
  });
  await touchApp(appId);
}
