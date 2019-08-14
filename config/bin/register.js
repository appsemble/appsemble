#!/usr/bin/env node
import { logger } from '@appsemble/node-utils';
import axios from 'axios';

import { appsembleServer } from '../../package.json';

/**
 * Register a user account for uploading blocks.
 */
async function main() {
  logger.info('Registering bot user account');
  const { APPSEMBLE_EMAIL, APPSEMBLE_PASSWORD } = process.env;
  const { 'ignore-conflict': ignoreConflict, remote } = appsembleServer;
  try {
    await axios.post(
      '/api/email',
      { email: APPSEMBLE_EMAIL, password: APPSEMBLE_PASSWORD, organization: 'appsemble' },
      { baseURL: remote },
    );
    logger.info(`Registered user ${APPSEMBLE_EMAIL}`);
  } catch (err) {
    if (ignoreConflict && err && err.response && err.response.status === 409) {
      logger.warn('Registration conflict ignored');
      return;
    }
    throw err;
  }
}

main().catch(err => {
  logger.error(err);
  process.exit(1);
});
