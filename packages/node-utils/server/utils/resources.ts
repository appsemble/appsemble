import { type ResourceDefinition } from '@appsemble/lang-sdk';
import { type App } from '@appsemble/types';
import { type Context } from 'koa';

import { throwKoaError } from '../../koa.js';
import { logger } from '../../logger.js';
import { type FindOptions, type Options, type OrderItem, type WhereOptions } from '../types.js';

/**
 * The `selectedGroupId` value representing the app-wide (ungrouped) scope, as
 * opposed to a concrete group id.
 */
export const appWideGroupId = -1;

/**
 * Collapse a `selectedGroupId` selection to a single group for operations that
 * are inherently scoped to one group (create, update, reorder).
 *
 * @param selectedGroupId The selected group ids from the query parameters.
 * @returns The first concrete group id, or null for the app-wide scope.
 */
export function getSingleGroupId(selectedGroupId: number[] = []): number | null {
  const [groupId] = selectedGroupId;
  return groupId != null && groupId > 0 ? groupId : null;
}

/**
 * Build a resource `GroupId` filter for operations that may span multiple
 * groups (query, delete).
 *
 * The app-wide scope (`appWideGroupId`, or an empty selection) matches
 * resources without a group; concrete ids match resources in those groups.
 *
 * @param selectedGroupId The selected group ids from the query parameters.
 * @returns A value for a resource `GroupId` where clause.
 */
export function getGroupIdWhere(selectedGroupId: number[] = []): WhereOptions[string] {
  const groupIds = selectedGroupId.filter((id) => id > 0);
  const includeUngrouped = selectedGroupId.length === 0 || selectedGroupId.includes(appWideGroupId);

  if (!groupIds.length) {
    return null;
  }

  return includeUngrouped ? { or: [{ in: groupIds }, null] } : { in: groupIds };
}

export function generateResourceQuery(
  ctx: Context,
  { parseQuery }: Options,
  resourceDefinition?: ResourceDefinition,
): { order: OrderItem[]; where: WhereOptions } {
  try {
    return parseQuery({
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      $filter: ctx.queryParams.$filter,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      $orderby: ctx.queryParams.$orderby,
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      resourceDefinition,
      tableName: 'Resource',
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      throwKoaError(ctx, 400, 'Unable to process this query', { syntaxError: error.message });
    }
    logger.error(error);
    throwKoaError(ctx, 400, 'Unable to process this query');
  }
}

export async function deleteResourcesRecursively(
  type: string,
  app: App,
  options: Options,
  context: Context,
): Promise<void> {
  const { deleteAppResource, getAppResources } = options;

  const referencingResources = Object.entries(app.definition.resources ?? {}).filter(
    ([, resourceDefinition]) =>
      Object.values(resourceDefinition.references ?? {}).find(
        (resourceReference) => resourceReference.resource === type,
      ),
  );

  for (const [referencingResourceType] of referencingResources) {
    await deleteResourcesRecursively(referencingResourceType, app, options, context);
  }

  const resourcesToDeleteFindOptions: FindOptions = {
    attributes: ['id'],
    where: {
      type,
      or: [{ seed: true }, { ephemeral: true }],
    },
  };

  const resourcesToDelete = await getAppResources({
    app,
    findOptions: resourcesToDeleteFindOptions,
    type,
    context,
  });

  for (const resourceToDelete of resourcesToDelete) {
    await deleteAppResource({
      app,
      context,
      options,
      id: resourceToDelete.id,
      type,
    });
  }
}
