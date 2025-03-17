import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppServiceSecret } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';

export async function getAppServiceSecrets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryAppSecrets],
  });

  const serviceSecrets = await AppServiceSecret.findAll({
    attributes: [
      'id',
      'name',
      'urlPatterns',
      'authenticationMethod',
      'identifier',
      'tokenUrl',
      'scope',
      'ca',
    ],
    where: {
      AppId: appId,
    },
  });

  ctx.body = serviceSecrets.map((secret) => secret.toJSON());
}
