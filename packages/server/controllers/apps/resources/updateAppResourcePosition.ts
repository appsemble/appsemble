import { assertKoaCondition, getResourceDefinition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, getAppDB } from '../../../models/index.js';
import { checkAppPermissions } from '../../../utils/authorization.js';
import { parseQuery } from '../../../utils/resource.js';

export async function updateAppResourcePosition(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    queryParams: { $filter, selectedGroupId },
    request: {
      body: { nextResourcePosition, prevResourcePosition },
    },
    user: authSubject,
  } = ctx;
  const { Resource } = await getAppDB(appId);
  const app = await App.findByPk(appId);
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  const resourceDefinition = getResourceDefinition(app.definition, resourceType);
  const { query } = parseQuery({ $filter, resourceDefinition, tableName: 'Resource' });
  const commonFindOptions = {
    ...(query ? { query } : {}),
    type: resourceType,
    GroupId: selectedGroupId ?? null,
    ...(app.demoMode ? { ephemeral: true, seed: false } : {}),
  };
  if (!nextResourcePosition) {
    const count = await Resource.count({
      where: {
        [Op.and]: [commonFindOptions, { Position: { [Op.gt]: prevResourcePosition } }],
      },
    });
    assertKoaCondition(!(count > 0), ctx, 400, 'Invalid Position');
  }
  if (!prevResourcePosition) {
    const count = await Resource.count({
      where: {
        [Op.and]: [{ ...commonFindOptions }, { Position: { [Op.lt]: nextResourcePosition } }],
      },
    });
    assertKoaCondition(!(count > 0), ctx, 400, 'Invalid Position');
  }

  const nextPositionResource = await Resource.findOne({
    attributes: ['Position'],
    where: {
      [Op.and]: [
        { ...commonFindOptions },
        { ...(nextResourcePosition ? { Position: nextResourcePosition } : {}) },
      ],
    },
  });
  const prevPositionResource = await Resource.findOne({
    attributes: ['Position'],
    where: {
      [Op.and]: [
        { ...commonFindOptions },
        { ...(prevResourcePosition ? { Position: prevResourcePosition } : {}) },
      ],
    },
  });
  const resourcesInBetween = await Resource.count({
    where: {
      [Op.and]: [
        { ...commonFindOptions },
        {
          Position: {
            [Op.and]: {
              [Op.gt]: prevResourcePosition,
              [Op.lt]: nextResourcePosition,
            },
          },
        },
      ],
    },
  });
  assertKoaCondition(
    !(!nextPositionResource || !prevPositionResource || resourcesInBetween !== 0),
    ctx,
    400,
    'Invalid previous or next resource Position',
  );

  if (nextResourcePosition && prevResourcePosition) {
    assertKoaCondition(
      !(nextResourcePosition <= prevResourcePosition),
      ctx,
      400,
      'Previous resource Position should be less than the next resource',
    );
  }

  const oldResource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, GroupId: selectedGroupId ?? null },
    include: [{ association: 'Author', attributes: ['id', 'name'], required: false }],
    attributes: ['Position', 'id', 'created', 'updated'],
  });

  assertKoaCondition(oldResource != null, ctx, 404, 'Resource not found');
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
      where: { type: resourceType },
      order: [['Position', 'ASC']],
    });
    resetPositionResources.map(async (resource, index) => {
      await resource.update({ Position: index });
    });
  }
  await oldResource.update({ Position: updatedPosition });
  ctx.status = 200;
  ctx.body = (await oldResource.reload()).toJSON();
}
