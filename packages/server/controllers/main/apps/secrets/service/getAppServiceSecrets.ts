import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppServiceSecret } from '../../../../../models/index.js';
import { checkUserPermissions } from '../../../../../utils/authorization.js';
import { checkAppLock } from '../../../../../utils/checkAppLock.js';

export async function getAppServiceSecrets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.QueryAppSecrets]);

  const serviceSecrets = await AppServiceSecret.findAll({
    attributes: ['id', 'name', 'urlPatterns', 'authenticationMethod', 'identifier', 'tokenUrl'],
    where: {
      AppId: appId,
    },
  });

  ctx.body = serviceSecrets.map((secret) => secret.toJSON());
}
