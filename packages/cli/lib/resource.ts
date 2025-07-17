import { readFile } from 'node:fs/promises';

import { type ResourceDefinition } from '@appsemble/lang-sdk';
import { AppsembleError, logger, readData } from '@appsemble/node-utils';
import { type Resource } from '@appsemble/types';
import axios from 'axios';

interface UpdateResourceParams {
  /**
   * The name of the resource that a new entry is being created of.
   */
  resourceName: string;

  /**
   * The path in which the resource JSON is located.
   */
  path: string;

  /**
   * The ID of the app to create a resource entry for.
   */
  appId: number;

  /**
   * The remote server to create the resource on.
   */
  remote: string;
}

interface PublishResourceParams {
  /**
   * The name of the resource that a new entry is being created of.
   */
  type: string;

  /**
   * The path in which the resource JSON is located.
   */
  path: string;

  /**
   * The ID of the app to publish a resource entry for.
   */
  appId: number;

  /**
   * The remote server to publish the resource on.
   */
  remote: string;

  /**
   * Whether the published resource should be used as seed.
   */
  seed: boolean;

  /**
   * The definition of the resource.
   */
  definition?: ResourceDefinition;

  /**
   * An array of property name to value maps of referenced resources.
   */
  publishedResourcesIds?: Record<string, number[]>;
}

export interface ResourceToPublish {
  appId: number;
  path: string;
  type: string;
  definition: ResourceDefinition;
}

interface PublishResourcesRecursivelyParams {
  /**
   * The remote server to publish the resource on.
   */
  remote: string;

  /**
   * Whether the published resources should be used as seed.
   */
  seed: boolean;

  /**
   * All resources that need to be published.
   */
  resourcesToPublish: ResourceToPublish[];

  /**
   * Already published resources.
   */
  publishedResourcesIds: Record<string, number[]>;
}

export async function publishResource({
  appId,
  definition,
  path,
  publishedResourcesIds = {},
  remote,
  seed,
  type,
}: PublishResourceParams): Promise<number[]> {
  const csv = path.endsWith('.csv');
  let resources: Buffer | Resource[];

  if (csv) {
    resources = await readFile(path);
  } else {
    const [file] = await readData<Resource>(path);

    if (typeof file !== 'object') {
      throw new AppsembleError(`File at ${path} does not contain an object or array of objects`);
    }

    resources = ([] as Resource[]).concat(file);
  }

  logger.info(`Publishing resource(s) from ${path}`);

  let data;
  const endpoint = `/api/apps/${appId}/resources/${type}`;
  try {
    if (csv) {
      const response = await axios.post<Resource | Resource[]>(endpoint, resources, {
        baseURL: remote,
        headers: { 'content-type': 'text/csv' },
        params: { seed },
      });
      data = response.data;
    } else {
      const response = await axios.post<Resource | Resource[]>(
        endpoint,
        (resources as Resource[]).map((resource) => {
          const resourceWithReferences = { ...resource };
          for (const [referencedProperty, resourceReference] of Object.entries(
            definition?.references ?? {},
          )) {
            resourceWithReferences[referencedProperty] =
              resourceWithReferences[referencedProperty] ||
              publishedResourcesIds[resourceReference.resource]?.[
                Number(resource[`$${resourceReference.resource}`] ?? -1)
              ];
          }
          return resourceWithReferences;
        }),
        {
          baseURL: remote,
          headers: { 'content-type': 'application/json' },
          params: { seed },
        },
      );
      data = response.data;
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }

  const ids: number[] = ([] as Resource[]).concat(data).map((d: Resource) => d.id);
  const url = new URL(`/apps/${appId}/resources/${type}/`, remote);
  logger.info(
    `Successfully published ${ids.length} resource${resources.length === 1 ? '' : 's'} at: \n${ids
      .map((id) => `${url}${id}`)
      .join('\n')}`,
  );
  return ids;
}

export async function publishResourcesRecursively({
  publishedResourcesIds,
  remote,
  resourcesToPublish,
  seed,
}: PublishResourcesRecursivelyParams): Promise<Record<string, number[]>> {
  let updatedPublishedResourcesIds: Record<string, number[]> = { ...publishedResourcesIds };
  for (const resourceToPublish of resourcesToPublish) {
    const resourceReferences = resourceToPublish.definition.references;

    if (resourceReferences) {
      for (const resourceReference of Object.values(resourceReferences)) {
        const referencedResourceType = resourceReference.resource;
        const referencedResourcesToPublish = resourcesToPublish.filter(
          (referencedResourceToPublish) =>
            referencedResourceToPublish.type === referencedResourceType,
        );

        if (
          referencedResourcesToPublish.length &&
          !updatedPublishedResourcesIds[referencedResourceType]
        ) {
          const referencedPublishedResourcesIds = await publishResourcesRecursively({
            resourcesToPublish: referencedResourcesToPublish,
            publishedResourcesIds: updatedPublishedResourcesIds,
            remote,
            seed,
          });

          updatedPublishedResourcesIds = {
            ...updatedPublishedResourcesIds,
            ...referencedPublishedResourcesIds,
          };
        }
      }
    }

    if (!updatedPublishedResourcesIds[resourceToPublish.type]) {
      updatedPublishedResourcesIds[resourceToPublish.type] = await publishResource({
        ...resourceToPublish,
        publishedResourcesIds: updatedPublishedResourcesIds,
        remote,
        seed,
      });
    }
  }

  return updatedPublishedResourcesIds;
}

export async function updateResource({
  appId,
  path,
  remote,
  resourceName,
}: UpdateResourceParams): Promise<void> {
  const [file] = await readData<Resource>(path);

  if (typeof file !== 'object') {
    throw new AppsembleError(`File at ${path} does not contain an object or array of objects`);
  }

  const resources = ([] as Resource[]).concat(file);
  logger.info(`Updating ${resources.length} resource(s) from ${path}`);

  for (const resource of resources) {
    if (!resource.id) {
      logger.info(`Skipping resource ${resources.indexOf(resource)} because it has no ID.`);
      continue;
    }

    try {
      const {
        data: { id },
      } = await axios.put<Resource>(
        `/api/apps/${appId}/resources/${resourceName}/${resource.id}`,
        resource,
        {
          baseURL: remote,
        },
      );

      logger.info(
        `Successfully updated resource ${id} at ${new URL(
          `/apps/${appId}/resources/${resourceName}/${id}`,
          remote,
        )}`,
      );
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}
