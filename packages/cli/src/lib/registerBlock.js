import { logger } from '@appsemble/node-utils';
import axios from 'axios';

import getBlockConfig from './getBlockConfig';

export default async function registerBlock({ ignoreConflict, path }) {
  const config = await getBlockConfig(path);
  logger.info(`Registering block ${config.id}`);
  const { description, id } = config;
  try {
    await axios.post('/api/blocks', { description, id });
    logger.info(`Registration of ${config.id} successful! 🎉`);
  } catch (err) {
    if (!ignoreConflict || !err.request || err.response.status !== 409) {
      throw err;
    }
    logger.warn(`${config.id} was already registered.`);
  }
}
