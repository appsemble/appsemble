import {
  assertKoaError,
  deleteCompanionContainers,
  formatServiceName,
} from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';
import { checkRole } from '../../../utils/checkRole.js';

export async function deleteApp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'OrganizationId', 'definition'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, Permission.DeleteApps);

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
