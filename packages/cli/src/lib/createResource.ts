import { AppsembleError, logger, readData } from '@appsemble/node-utils';
import { Resource } from '@appsemble/types';
import axios from 'axios';

interface CreateResourceParams {
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

export async function createResource({
  appId,
  path,
  remote,
  resourceName,
}: CreateResourceParams): Promise<void> {
  const [file] = await readData<Resource>(path);

  if (typeof file !== 'object') {
    throw new AppsembleError(`File at ${path} does not contain an object or array of objects`);
  }

  const resources = [].concat(file);
  logger.info(`Creating ${resources.length} resource(s) from ${path}`);

  for (const resource of resources) {
    const {
      data: { id },
    } = await axios.post<Resource>(`/api/apps/${appId}/resources/${resourceName}`, resource, {
      baseURL: remote,
    });

    logger.info(
      `Successfully created resource ${id} at ${new URL(
        `/apps/${appId}/resources/${resourceName}/${id}`,
        remote,
      )}`,
    );
  }
}
