import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, getAppDB } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { checkAppLock } from '../../../../utils/checkAppLock.js';

export async function updateAppVariable(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appVariableId },
    request: { body },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  checkAppLock(ctx, app);

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.UpdateAppVariables],
  });

  const { AppVariable } = await getAppDB(appId);
  if (body.name) {
    const { name } = body;
    const existing = await AppVariable.findOne({
      where: { [Op.and]: { name, [Op.not]: { id: appVariableId } } },
    });

    assertKoaCondition(existing == null, ctx, 400, `App variable with name ${name} already exists`);
  }

  const appVariable = await AppVariable.findByPk(appVariableId);
  assertKoaCondition(appVariable != null, ctx, 404, 'Cannot find the app variable to update');

  await appVariable.update(body);

  const { id, name, value } = appVariable;

  ctx.body = {
    id,
    name,
    value,
  };
}
