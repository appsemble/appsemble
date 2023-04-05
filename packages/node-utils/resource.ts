import { App, ResourceDefinition } from '@appsemble/types';
import { notFound } from '@hapi/boom';

/**
 * Get the resource definition of an app by name.
 *
 * If there is no match, a 404 HTTP error is thrown.
 *
 * @param app The app to get the resource definition of
 * @param resourceType The name of the resource definition to get.
 * @param view The view that’s being used.
 * @returns The matching resource definition.
 */
export function getResourceDefinition(
  app: App,
  resourceType: string,
  view?: string,
): ResourceDefinition {
  if (!app) {
    throw notFound('App not found');
  }

  const definition = app.definition.resources?.[resourceType];

  if (!definition) {
    throw notFound(`App does not have resources called ${resourceType}`);
  }

  if (view && !definition.views[view]) {
    throw notFound(`View ${view} does not exist for resource type ${resourceType}`);
  }

  return definition;
}
