import {
  assertKoaError,
  deleteCompanionContainers,
  formatServiceName,
} from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';
import { checkUserPermissions } from '../../../utils/authorization.js';

export async function deleteApp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'OrganizationId', 'definition'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.DeleteApps]);

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
