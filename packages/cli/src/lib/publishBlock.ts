import { logger } from '@appsemble/node-utils';
import axios, { AxiosError } from 'axios';

import type { BlockConfig } from '../types';
import { makePayload } from './makePayload';

/**
 * Publish a new block version.
 *
 * @param config - The block configuration
 * @param ignoreConflict - Prevent the command from crashing when a conflict has been detected.
 */
export async function publishBlock(config: BlockConfig, ignoreConflict: boolean): Promise<void> {
  logger.info(`Publishing ${config.name}@${config.version}…`);
  const form = await makePayload(config);

  try {
    await axios.post('/api/blocks', form);
    logger.info(`Successfully published ${config.name}@${config.version} 🎉`);
  } catch (err: unknown) {
    if (!ignoreConflict || !((err as AxiosError).response?.status !== 409)) {
      throw err;
    }
    logger.warn(`${config.name}@${config.version} was already published.`);
  }
}
