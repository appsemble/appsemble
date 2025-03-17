import {
  assertKoaCondition,
  deleteCompanionContainers,
  formatServiceName,
} from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function deleteApp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'OrganizationId', 'definition'] });

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.DeleteApps],
  });

  await app.update({ path: null });
  await app.destroy();

  if (app.definition.containers && app.definition.containers.length > 0) {
    for (const def of app.definition.containers) {
      await deleteCompanionContainers(
        formatServiceName(def.name, app.definition?.name, String(appId)),
      );
    }
  }
}
