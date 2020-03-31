import { logger } from '@appsemble/node-utils';
import axios from 'axios';

import { BlockConfig } from '../types';
import makePayload from './makePayload';

interface PublishParams {
  /**
   * The block configuration
   */
  config: BlockConfig;

  /**
   * Prevent the command from crashing when a conflict has been detected.
   */
  ignoreConflict: boolean;

  /**
   * The path in which the block project is located.
   */
  path: string;
}

/**
 * Publish a new block version.
 */
export default async function publish({
  config,
  ignoreConflict,
  path,
}: PublishParams): Promise<void> {
  logger.info(`Publishing ${config.name}@${config.version}…`);
  const form = await makePayload({ config, path });
  try {
    await axios.post('/api/blocks', form);
    logger.info(`Successfully published ${config.name}@${config.version} 🎉`);
  } catch (err) {
    if (!ignoreConflict || !err.request || err.response.status !== 409) {
      throw err;
    }
    logger.warn(`${config.name}@${config.version} was already published.`);
  }
}
