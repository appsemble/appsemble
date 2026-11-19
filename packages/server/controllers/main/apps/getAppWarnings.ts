import { assertKoaCondition } from '@appsemble/node-utils';
import { type AppWarning, OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { isSecretIncomplete } from '../../../utils/secrets.js';

export async function getAppWarnings(ctx: Context): Promise<void> {
  const { appId } = ctx.pathParams;
  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'scimEnabled', 'scimToken'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryAppSecrets],
  });

  const { AppOAuth2Secret, AppServiceSecret } = await getAppDB(appId);
  const [serviceSecrets, oauth2Secrets] = await Promise.all([
    AppServiceSecret.findAll({
      attributes: ['id', 'name', 'secret', 'urlPatterns'],
      order: [['id', 'ASC']],
    }),
    AppOAuth2Secret.findAll({
      attributes: ['clientSecret', 'id', 'name'],
      order: [['id', 'ASC']],
    }),
  ]);

  const warnings: AppWarning[] = [
    ...serviceSecrets
      .filter(({ secret }) => isSecretIncomplete(secret))
      .map(({ id, name, urlPatterns }): AppWarning => ({
        code: 'missing-secret',
        type: 'service',
        id,
        name: name || urlPatterns,
      })),
    ...oauth2Secrets
      .filter(({ clientSecret }) => isSecretIncomplete(clientSecret))
      .map(({ id, name }): AppWarning => ({ code: 'missing-secret', type: 'oauth2', id, name })),
  ];
  if (app.scimEnabled && isSecretIncomplete(app.scimToken)) {
    warnings.push({ code: 'missing-secret', type: 'scim', name: 'SCIM' });
  }

  ctx.body = warnings;
}
