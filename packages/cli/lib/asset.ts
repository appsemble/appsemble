import { createReadStream } from 'node:fs';

import { logger } from '@appsemble/node-utils';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import FormData from 'form-data';

interface PublishAssetParams {
  /**
   * The name of the asset being uploaded.
   * This must be a unique name for the app. If left empty, the ID is used instead.
   */
  name?: string;

  /**
   * The path in which the resource JSON is located.
   */
  path: string;

  /**
   * The ID of the app to publish a resource entry for.
   */
  appId: number;

  /**
   * The remote server to publish the asset on.
   */
  remote: string;

  /**
   * Whether the published asset should be used as seed.
   */
  seed: boolean;

  /**
   * Whether the asset should be clonable.
   */
  clonable: boolean;
}

export async function publishAsset({
  appId,
  clonable,
  name,
  path,
  remote,
  seed,
}: PublishAssetParams): Promise<void> {
  try {
    const formData = new FormData();
    const file = createReadStream(path);
    formData.append('file', file);
    formData.append('clonable', String(clonable));
    if (name) {
      formData.append('name', normalize(name));
    }

    const {
      data: { id },
    } = await axios.post<{ id: string }>(`/api/apps/${appId}/assets`, formData, {
      baseURL: remote,
      params: { seed },
    });
    logger.info(`Published asset ${id}${name ? ` with name ${normalize(name)}` : ''}`);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
