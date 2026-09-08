import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { deleteSeedResources } from '../../../../utils/deleteSeedResources.js';

export async function deleteAppSeedResources(ctx: Context): Promise<void> {
  const app = await App.findByPk(ctx.pathParams.appId);
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.DeleteAppResources],
  });

  const { sequelize } = await getAppDB(app.id);
  await sequelize.transaction(async (transaction) => {
    // Serialize replacement with resource writers while allowing readers to see committed data.
    await sequelize.query('LOCK TABLE "Resource" IN EXCLUSIVE MODE', { transaction });
    await deleteSeedResources(app, ctx, transaction);
  });
  ctx.status = 204;
}
