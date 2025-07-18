import { assertKoaCondition, getResourceDefinition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { options } from '../../../../options/options.js';
import { checkAppPermissions } from '../../../../utils/authorization.js';
import {
  processHooks,
  processReferenceHooks,
  processReferenceTriggers,
} from '../../../../utils/resource.js';

export async function deleteAppResources(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceType },
    queryParams: { selectedGroupId },
    request: { body },
  } = ctx;
  const { Resource } = await getAppDB(appId);
  const app = await App.findByPk(appId, {
    attributes: ['definition', 'id'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [`$resource:${resourceType}:delete`],
    groupId: selectedGroupId,
  });

  getResourceDefinition(app.definition, resourceType, ctx);

  let deletedAmount = 0;
  while (deletedAmount < body.length) {
    for (const resource of await Resource.findAll({
      where: {
        id: body.slice(deletedAmount, deletedAmount + 100),
        type: resourceType,
        GroupId: selectedGroupId ?? null,
      },
      limit: 100,
    })) {
      processReferenceHooks(app, resource, 'delete', options, ctx);
      processHooks(app, resource, 'delete', options, ctx);

      await processReferenceTriggers(app, resource, 'delete', ctx);

      await resource.destroy();
    }
    deletedAmount += 100;
  }

  ctx.status = 204;
}
