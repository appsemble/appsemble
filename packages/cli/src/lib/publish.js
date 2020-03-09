import { logger } from '@appsemble/node-utils';
import axios from 'axios';

import makePayload from './makePayload';

/**
 * Publish a new block version.
 *
 * @param {Object} params
 * @param {Object} params.config The block configuration
 * @param {string} params.path The path in which the block project is located.
 */
export default async function publish({ config, ignoreConflict, path }) {
  logger.info(`Publishing ${config.id}@${config.version}…`);
  const form = await makePayload({ config, path });
  try {
    await axios.post(`/api/blocks/${config.id}/versions`, form);
    logger.info(`Successfully published ${config.id}@${config.version} 🎉`);
  } catch (err) {
    if (!ignoreConflict || !err.request || err.response.status !== 409) {
      throw err;
    }
    logger.warn(`${config.id}@${config.version} was already published.`);
  }
}
