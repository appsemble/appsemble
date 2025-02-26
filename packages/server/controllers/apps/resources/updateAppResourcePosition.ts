import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, Resource } from '../../../models/index.js';
import { checkAppPermissions } from '../../../utils/authorization.js';

export async function updateAppResourcePosition(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    request: {
      body: { nextResourcePosition, prevResourcePosition },
    },
    user: authSubject,
  } = ctx;

  const app = await App.findByPk(appId);
  assertKoaError(!app, ctx, 404, 'App not found');
  if (!nextResourcePosition) {
    const count = await Resource.count({
      where: { AppId: appId, type: resourceType, Position: { [Op.gt]: prevResourcePosition } },
    });
    assertKoaError(count > 0, ctx, 400, 'Invalid Position');
  }
  if (!prevResourcePosition) {
    const count = await Resource.count({
      where: { AppId: appId, type: resourceType, Position: { [Op.lt]: nextResourcePosition } },
    });
    assertKoaError(count > 0, ctx, 400, 'Invalid Position');
  }

  const nextPositionResource = await Resource.findOne({
    attributes: ['Position'],
    where: {
      AppId: appId,
      type: resourceType,
      ...(nextResourcePosition ? { Position: nextResourcePosition } : {}),
    },
  });
  const prevPositionResource = await Resource.findOne({
    attributes: ['Position'],
    where: {
      AppId: appId,
      type: resourceType,
      ...(prevResourcePosition ? { Position: prevResourcePosition } : {}),
    },
  });
  const resourcesInBetween = await Resource.count({
    where: {
      AppId: appId,
      type: resourceType,
      Position: {
        [Op.and]: {
          [Op.gt]: prevResourcePosition,
          [Op.lt]: nextResourcePosition,
        },
      },
    },
  });
  assertKoaError(
    !nextPositionResource || !prevPositionResource || resourcesInBetween !== 0,
    ctx,
    400,
    'Invalid previous or next resource Position',
  );

  if (nextResourcePosition && prevResourcePosition) {
    assertKoaError(
      nextResourcePosition <= prevResourcePosition,
      ctx,
      400,
      'Previous resource Position should be less than the next resource',
    );
  }

  const oldResource = await Resource.findOne({
    where: { id: resourceId, type: resourceType },
    include: [{ association: 'Author', attributes: ['id', 'name'], required: false }],
    attributes: ['Position', 'id', 'created', 'updated'],
  });

  assertKoaError(!oldResource, ctx, 404, 'Resource not found');
  await checkAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [
      oldResource.toJSON().$author?.id === authSubject?.id
        ? `$resource:${resourceType}:own:update`
        : `$resource:${resourceType}:update`,
    ],
  });
  // If the previous Position is not defined i.e. to insert at the top, use 0 as the default.
  // e.g. If the Position of the first element is 1, the position for the updated first element
  // becomes (0 + 1)/2 = 0.5, similarly, for moving an element to the last of the list, we multiply
  // with 1.1 to make the Position greater than the lastResourcePosition
  const updatedPosition =
    nextResourcePosition == null
      ? prevResourcePosition * 1.1
      : ((prevResourcePosition ?? 0) + nextResourcePosition) / 2;
  // If there is a collision, reset the positions.
  if (
    nextResourcePosition &&
    (updatedPosition >= nextResourcePosition || updatedPosition <= (prevResourcePosition ?? 0))
  ) {
    const resetPositionResources = await Resource.findAll({
      attributes: ['id'],
      where: { type: resourceType, AppId: appId },
      order: [['Position', 'ASC']],
    });
    resetPositionResources.map(async (resource, index) => {
      await resource.update({ Position: index });
    });
  }
  await Resource.update(
    { Position: updatedPosition },
    { where: { id: oldResource.id, type: resourceType } },
  );
  ctx.status = 200;
  const orderedResources = (
    await Resource.findAll({
      where: { type: resourceType, AppId: appId },
      order: [['Position', 'ASC']],
    })
  ).map((item) => item.toJSON());
  ctx.body = orderedResources;
}
