import { assertKoaError, getResourceDefinition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppMember, Resource, ResourceVersion } from '../../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';

export async function getAppResourceVersions(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['OrganizationId', 'definition'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    requiredPermissions: [OrganizationPermission.QueryAppResources],
    organizationId: app.OrganizationId,
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
