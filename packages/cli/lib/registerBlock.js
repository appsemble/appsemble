import { logger } from '@appsemble/node-utils';

import getBlockConfig from './getBlockConfig';
import { post } from './request';

export default async function registerBlock({ path, ignoreConflict }) {
  const config = await getBlockConfig(path);
  logger.info(`Registering block ${config.id}`);
  const { description: desc, id } = config;
  try {
    await post('/api/blocks', { description: desc, id });
    logger.info(`Registration of ${config.id} successful! 🎉`);
  } catch (err) {
    if (!ignoreConflict || !err.request || err.response.status !== 409) {
      throw err;
    }
    logger.warn(`${config.id} was already registered.`);
  }
}
