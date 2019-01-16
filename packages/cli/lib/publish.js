import logging from 'winston';

import makePayload from './makePayload';
import { post } from './request';

/**
 * Publish a new block version.
 *
 * @param {Object} params
 * @param {Object} params.config The block configuration
 * @param {string} params.path The path in which the block project is located.
 */
export default async function publish({ ignoreConflict, path, config }) {
  logging.info(`Publishing ${config.id}@${config.version}…`);
  const form = await makePayload({ config, path });
  try {
    await post(`/api/blocks/${config.id}/versions`, form);
    logging.info(`Successfully published ${config.id}@${config.version} 🎉`);
  } catch (err) {
    if (!ignoreConflict || !err.request || err.response.status !== 409) {
      throw err;
    }
    logging.warn(`${config.id}@${config.version} was already published.`);
  }
}
