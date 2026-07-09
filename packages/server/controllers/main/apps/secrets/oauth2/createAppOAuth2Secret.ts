import { getAppRoles } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';
import {
  normalizeLoginRoleMappings,
  validateLoginRoleMappings,
} from '../../../../../utils/loginRoleMappings.js';

export async function createAppOAuth2Secret(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateAppSecrets],
  });

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

  const normalizedBody = {
    ...body,
    roleMappings: normalizeLoginRoleMappings(body.roleMappings),
    userInfoUrl: body.userInfoUrl || null,
  };

  const { AppOAuth2Secret } = await getAppDB(appId);
  const { id } = await AppOAuth2Secret.create(normalizedBody);
  ctx.body = { ...normalizedBody, id };
}
