import { logger } from '@appsemble/node-utils';
import { SSLStatusMap } from '@appsemble/types';
import axios from 'axios';

const { CI_MERGE_REQUEST_IID } = process.env;

export const command = 'wait-for-api';
export const description =
  'Wait for the SSL certificate to be ready for the API of a review environment';

export async function handler(): Promise<void> {
  const reviewDomain = `${CI_MERGE_REQUEST_IID || 'staging'}.appsemble.review`;
  await new Promise<void>((resolve) => {
    const interval = setInterval(async () => {
      const url = `https://${reviewDomain}`;
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
