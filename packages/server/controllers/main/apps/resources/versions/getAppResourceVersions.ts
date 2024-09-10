import { assertKoaError, getResourceDefinition } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, Resource, ResourceVersion } from '../../../../../models/index.js';
import { checkUserPermissions } from '../../../../../utils/authorization.js';

export async function getAppResourceVersions(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['OrganizationId'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.QueryAppResources]);

  const resource = await Resource.findOne({
    where: {
      AppId: appId,
      id: resourceId,
      type: resourceType,
      include: [
        { association: 'Editor' },
        { model: ResourceVersion, include: [{ model: AppMember }], order: [['created', 'DESC']] },
      ],
    },
  });

  assertKoaError(!resource, ctx, 404, 'Resource not found');

  const definition = getResourceDefinition(app.toJSON(), resourceType, ctx);

  assertKoaError(!definition.history, ctx, 404, `Resource “${resourceType}” has no history`);

  ctx.body = [
    {
      created: resource.updated,
      data: resource.data,
      author: resource.Editor ? { id: resource.Editor.id, name: resource.Editor.name } : undefined,
    },
    ...resource.ResourceVersions,
  ];
}
