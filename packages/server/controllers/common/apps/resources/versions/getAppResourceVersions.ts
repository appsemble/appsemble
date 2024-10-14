import { assertKoaError, getResourceDefinition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember, Resource, ResourceVersion } from '../../../../../models/index.js';
import { checkAppPermissions } from '../../../../../options/checkAppPermissions.js';

export async function getAppResourceVersions(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'OrganizationId', 'definition'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkAppPermissions({
    context: ctx,
    // Permissions: [`$resource:${resourceType}:getHistory`],
    permissions: ['$resource:all:getHistory'],
    app: app.toJSON(),
  });

  const resource = await Resource.findOne({
    where: {
      AppId: appId,
      id: resourceId,
      type: resourceType,
    },
    include: [
      { association: 'Editor' },
      { model: ResourceVersion, include: [{ model: AppMember }] },
    ],
  });

  const definition = getResourceDefinition(app.definition, resourceType, ctx);

  assertKoaError(!definition.history, ctx, 404, `Resource “${resourceType}” has no history`);

  assertKoaError(!resource, ctx, 404, 'Resource not found');

  ctx.body = [
    {
      created: resource.updated,
      data: resource.data,
      author: resource.Editor ? { id: resource.Editor.id, name: resource.Editor.name } : undefined,
    },
    ...resource.ResourceVersions.sort((a, b) => Number(b.created) - Number(a.created)),
  ];
}
