import { type App, type ResourceDefinition } from '@appsemble/types';
import { type Context } from 'koa';

import { throwKoaError } from '../../koa.js';
import { logger } from '../../logger.js';
import { type FindOptions, type Options, type OrderItem, type WhereOptions } from '../types.js';

export function generateResourceQuery(
  ctx: Context,
  { parseQuery }: Options,
  resourceDefinition?: ResourceDefinition,
): { order: OrderItem[]; where: WhereOptions } {
  try {
    return parseQuery({
      $filter: ctx.queryParams.$filter,
      $orderby: ctx.queryParams.$orderby,
      resourceDefinition,
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

  const referencingResources = Object.entries(app.definition.resources).filter(
    ([, resourceDefinition]) =>
      Object.values(resourceDefinition.references ?? {}).find(
        (resourceReference) => resourceReference.resource === type,
      ),
  );

  for (const [referencingResourceType] of referencingResources) {
    await deleteResourcesRecursively(referencingResourceType, app, options, context);
  }

  const resourcesToDeleteFindOptions: FindOptions = {
    where: {
      type,
      AppId: app.id,
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