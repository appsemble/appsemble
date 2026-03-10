import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../models/index.js';
import { checkAppPermissions } from '../../../utils/authorization.js';

export async function updateAppResourceGroup(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    queryParams: { selectedGroupId },
    request: {
      body: { groupId },
    },
    user: authSubject,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['id'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  const { Resource } = await getAppDB(appId);
  const resource = await Resource.findOne({
    where: {
      id: resourceId,
      ...(selectedGroupId ? { GroupId: selectedGroupId } : {}),
      type: resourceType,
    },
  });
  assertKoaCondition(resource != null, ctx, 404, 'Resource not found');
  // We should check for delete permissions in the group we're moving the resources from, because
  // we're removing a resource for that group
  await checkAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [
      resource.AuthorId === authSubject?.id
        ? `$resource:${resourceType}:own:delete`
        : `$resource:${resourceType}:delete`,
    ],
    groupId: selectedGroupId,
  });
  // We should check for create permissions in the group we're moving the resources to, because
  // we're essentially creating a resource for that group
  await checkAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [`$resource:${resourceType}:create`],
    groupId,
  });

  await resource.update({ GroupId: groupId });

  ctx.status = 200;
  ctx.body = groupId;
}
