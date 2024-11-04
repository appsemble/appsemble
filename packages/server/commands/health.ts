import { logger } from '@appsemble/node-utils';
import axios from 'axios';

import { argv } from '../utils/argv.js';

export const command = 'health';
export const description = 'Check if the locally running Appsemble server is still healthy';

export async function handler(): Promise<void> {
  const { host, port } = argv;
  const url = new URL(host);
  url.port = String(port);
  await axios.get(`${url}/main/api/health`);
  logger.info('API is healthy');
  process.exit();
}
