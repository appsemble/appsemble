import { appWideGroupId, assertKoaCondition, getResourceDefinition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../../models/index.js';
import { checkAppPermissions } from '../../../../../options/checkAppPermissions.js';
import { getGroupIdWhere } from '../../../../../utils/resource.js';

export async function getAppResourceVersions(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    queryParams: { selectedGroupId },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['id', 'OrganizationId', 'definition'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { AppMember, Resource, ResourceVersion } = await getAppDB(appId);
  const resource = await Resource.findOne({
    where: {
      id: resourceId,
      type: resourceType,
      GroupId: getGroupIdWhere(selectedGroupId),
    },
    include: [
      { association: 'Editor' },
      { model: ResourceVersion, include: [{ model: AppMember }] },
    ],
  });

  const definition = getResourceDefinition(app.definition, resourceType, ctx);

  assertKoaCondition(
    definition.history != null,
    ctx,
    404,
    `Resource “${resourceType}” has no history`,
  );

  assertKoaCondition(resource != null, ctx, 404, 'Resource not found');

  // The resource is searched across the selected groups; authorization is then
  // scoped to the group the resource actually belongs to.
  await checkAppPermissions({
    context: ctx,
    permissions: [`$resource:${resourceType}:history:get`],
    app: app.toJSON(),
    groupId: resource.GroupId ?? appWideGroupId,
  });

  ctx.body = [
    {
      created: resource.updated,
      data: resource.data,
      author: resource.Editor
        ? { id: resource.Editor.id, name: resource.Editor.name, email: resource.Editor.email }
        : undefined,
    },
    ...resource.ResourceVersions.sort((a, b) => Number(b.created) - Number(a.created)),
  ];
}
