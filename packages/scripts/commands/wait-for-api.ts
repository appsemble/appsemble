import { logger } from '@appsemble/node-utils';
import { type SSLStatusMap } from '@appsemble/types';
import axios from 'axios';

const { APPSEMBLE_REVIEW_DOMAIN, APPSEMBLE_STAGING_DOMAIN, CI_MERGE_REQUEST_IID } = process.env;

export const command = 'wait-for-api';
export const description =
  'Wait for the SSL certificate to be ready for the API of a review environment';

export async function handler(): Promise<void> {
  const domain = CI_MERGE_REQUEST_IID
    ? `${CI_MERGE_REQUEST_IID}.${APPSEMBLE_REVIEW_DOMAIN || 'appsemble.review'}`
    : APPSEMBLE_STAGING_DOMAIN || 'staging.appsemble.eu';
  await new Promise<void>((resolve) => {
    const interval = setInterval(async () => {
      const url = `https://${domain}`;
      try {
        logger.info(`Checking if server is ready on ${url}`);
        await axios.get<SSLStatusMap>(url, { validateStatus: () => true });
      } catch {
        logger.warn('API isn’t ready yet. Checking again in 10 seconds…');
        return;
      }
      clearInterval(interval);
      logger.info('API is ready');
      resolve();
    }, 10_000);
  });
}
