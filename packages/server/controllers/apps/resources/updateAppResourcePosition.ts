import { assertKoaCondition, getResourceDefinition, getSingleGroupId } from '@appsemble/node-utils';
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
  const groupId = getSingleGroupId(selectedGroupId);
  const { Resource } = await getAppDB(appId);
  const app = await App.findByPk(appId, { attributes: ['definition', 'demoMode'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  const resourceDefinition = getResourceDefinition(app.definition, resourceType);
  const { query } = parseQuery({ $filter, resourceDefinition, tableName: 'Resource' });

  const oldResource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, GroupId: groupId },
    include: [{ association: 'Author', attributes: ['id', 'name'], required: false }],
    attributes: ['Position', 'id', 'created', 'updated', 'data'],
  });

  assertKoaCondition(oldResource != null, ctx, 404, 'Resource not found');

  // Positions restart for every ordering group, so resources are only ordered against the
  // resources sharing their ordering group field values.
  const orderingGroup = Object.fromEntries(
    (resourceDefinition.enforceOrderingGroupByFields ?? []).map((field) => [
      `data.${field}`,
      oldResource.data[field] ?? null,
    ]),
  );

  const commonFindOptions = {
    ...(query ? { query } : {}),
    ...orderingGroup,
    type: resourceType,
    GroupId: groupId,
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

  await checkAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [
      oldResource.toJSON().$author?.id === authSubject?.id
        ? `$resource:${resourceType}:own:update`
        : `$resource:${resourceType}:update`,
    ],
    // Reordering happens within a single group; authorize against that group.
    groupId,
  });
  // If the previous Position is not defined i.e. to insert at the top, use 0 as the default.
  // e.g. If the Position of the first element is 1, the position for the updated first element
  // becomes (0 + 1)/2 = 0.5, similarly, for moving an element to the last of the list, we multiply
  // with 1.1 to make the Position greater than the lastResourcePosition
  let updatedPosition =
    nextResourcePosition == null
      ? prevResourcePosition * 1.1
      : ((prevResourcePosition ?? 0) + nextResourcePosition) / 2;
  // If there is a collision, reset the positions.
  if (
    (nextResourcePosition && updatedPosition >= nextResourcePosition) ||
    updatedPosition <= (prevResourcePosition ?? 0)
  ) {
    const resetPositionResources = await Resource.findAll({
      attributes: ['id', 'Position'],
      where: commonFindOptions,
      order: [['Position', 'ASC']],
    });
    const otherResources = resetPositionResources.filter(({ id }) => id !== oldResource.id);
    let updatedIndex = 0;
    if (prevResourcePosition != null) {
      const previousResourceIndex = otherResources.findIndex(
        ({ Position }) => Number(Position) === prevResourcePosition,
      );
      assertKoaCondition(
        previousResourceIndex !== -1,
        ctx,
        400,
        'Invalid previous or next resource Position',
      );
      updatedIndex = previousResourceIndex + 1;
    }
    await Promise.all(
      otherResources.map((resource, index) =>
        resource.update({ Position: (index < updatedIndex ? index + 1 : index + 2) * 10 }),
      ),
    );
    updatedPosition = (updatedIndex + 1) * 10;
  }
  await oldResource.update({ Position: updatedPosition });
  ctx.status = 200;
  ctx.body = (await oldResource.reload()).toJSON();
}
