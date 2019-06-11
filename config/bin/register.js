#!/usr/bin/env node
import { logger } from '@appsemble/node-utils';
import axios from 'axios';

import { appsembleServer } from '../../package.json';

/**
 * Register a user account for uploading blocks.
 */
async function main() {
  logger.info('Registering bot user account');
  const { email, remote, password } = appsembleServer;
  await axios.post(
    '/api/email',
    { email, password, organization: 'appsemble' },
    { baseURL: remote },
  );
  logger.info(`Registered user ${email}`);
}

main().catch(err => {
  logger.error(err);
  process.exit(1);
});
