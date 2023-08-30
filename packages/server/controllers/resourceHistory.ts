import { getResourceDefinition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, Resource, ResourceVersion, User } from '../models/index.js';

export async function getResourceHistory(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
  } = ctx;

  const app = await App.findOne({
    where: { id: appId },
    attributes: ['definition'],
    include: [
      {
        model: Resource,
        required: false,
        where: { id: resourceId, type: resourceType },
        include: [
          { association: 'Editor' },
          { model: ResourceVersion, include: [{ model: User }] },
        ],
      },
    ],
  });

  if (!app) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'App not found',
    };
    ctx.throw();
  }

  const definition = getResourceDefinition(app.toJSON(), resourceType, ctx);

  if (!definition.history) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: `Resource “${resourceType}” has no history`,
    };
    ctx.throw();
  }

  if (app.Resources.length !== 1) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Resource not found',
    };
    ctx.throw();
  }

  const [resource] = app.Resources;

  ctx.body = [
    {
      created: resource.updated,
      data: resource.data,
      author: resource.Editor ? { id: resource.Editor.id, name: resource.Editor.name } : undefined,
    },
    // XXX ideally this is done using Sequelize order.
    ...resource.ResourceVersions.sort((a, b) => Number(b.created) - Number(a.created)),
  ];
}
