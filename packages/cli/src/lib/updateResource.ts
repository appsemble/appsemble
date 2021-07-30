import { AppsembleError, logger } from '@appsemble/node-utils';
import axios from 'axios';
import { readJson } from 'fs-extra';

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
   * The remote server to create the app on.
   */
  remote: string;
}

export async function updateResource({
  appId,
  path,
  remote,
  resourceName,
}: UpdateResourceParams): Promise<void> {
  const file = await readJson(path);

  if (!appId) {
    throw new AppsembleError('The app id must be passed as a command line flag');
  }

  if (typeof file !== 'object') {
    throw new AppsembleError(`File at ${path} does not contain an object or array of objects`);
  }

  const resources = [].concat(file) as { id: number }[];
  logger.info(`Updating ${resources.length} resource(s) from ${path}`);

  for (const resource of resources) {
    if (!resource.id) {
      logger.info(`Skipping resource ${resources.indexOf(resource)} because it has no ID.`);
      continue;
    }

    const {
      data: { id },
    } = await axios.put<{ id: number }>(
      `/api/apps/${appId}/resources/${resourceName}/${resource.id}`,
      resource,
      {
        baseURL: remote,
      },
    );

    logger.info(
      `Successfully updated resource ${id} at ${new URL(
        `/api/apps/${appId}/resources/${resourceName}/${id}`,
        remote,
      )}`,
    );
  }
}
