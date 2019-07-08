import { logger } from '@appsemble/node-utils';
import axios from 'axios';

export const command = 'health';
export const description = 'Check if the locally running Appsemble server is still healthy';

export async function handler() {
  await axios.get('http://localhost:9999/api/health');
  logger.info('API is healthy');
}
