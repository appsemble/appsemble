import { getResourceDefinition } from '@appsemble/node-utils';
import { notFound } from '@hapi/boom';
import { Context } from 'koa';

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
    throw notFound('App not found');
  }

  const definition = getResourceDefinition(app.toJSON(), resourceType);

  if (!definition.history) {
    throw notFound(`Resource “${resourceType}” has no history`);
  }

  if (app.Resources.length !== 1) {
    throw notFound('Resource not found');
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
