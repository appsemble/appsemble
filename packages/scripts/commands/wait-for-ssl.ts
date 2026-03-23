import { logger } from '@appsemble/node-utils';
import { type SSLStatusMap } from '@appsemble/types';
import axios from 'axios';

const {
  APPSEMBLE_REVIEW_DOMAIN,
  APPSEMBLE_STAGING_DOMAIN,
  CI_MERGE_REQUEST_IID,
  WAIT_FOR_SSL_POLL_INTERVAL_MS = '10000',
  WAIT_FOR_SSL_TIMEOUT_MS = '300000',
} = process.env;

export const command = 'wait-for-ssl';
export const description =
  'Wait for the SSL certificate to be ready for apps in a review environment';

function sleep(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

export async function handler(): Promise<void> {
  const domain = CI_MERGE_REQUEST_IID
    ? `${CI_MERGE_REQUEST_IID}.${APPSEMBLE_REVIEW_DOMAIN || 'appsemble.review'}`
    : APPSEMBLE_STAGING_DOMAIN || 'staging.appsemble.eu';
  const sslDomain = `wait-for-ssl.appsemble.${domain}`;
  const pollInterval = Number(WAIT_FOR_SSL_POLL_INTERVAL_MS);
  const timeout = Number(WAIT_FOR_SSL_TIMEOUT_MS);
  const startedAt = Date.now();

  while (true) {
    const { data } = await axios.get<SSLStatusMap>(`https://${domain}/api/ssl`, {
      params: { domains: sslDomain },
    });
    const status = data[sslDomain];

    logger.info(`SSL status for ${sslDomain}: ${status}`);

    if (status === 'ready') {
      return;
    }

    if (status !== 'missing' && status !== 'pending' && status !== 'unknown') {
      throw new Error(`SSL status for ${sslDomain}: ${status}`);
    }

    if (Date.now() - startedAt >= timeout) {
      throw new Error(`Timed out waiting for SSL for ${sslDomain}. Last status: ${status}`);
    }

    await sleep(pollInterval);
  }
}
