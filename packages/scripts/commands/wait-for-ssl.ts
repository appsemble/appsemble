import { logger } from '@appsemble/node-utils';
import { type SSLStatusMap } from '@appsemble/types';
import axios from 'axios';

const { APPSEMBLE_REVIEW_DOMAIN, APPSEMBLE_STAGING_DOMAIN, CI_MERGE_REQUEST_IID } = process.env;

export const command = 'wait-for-ssl';
export const description =
  'Wait for the SSL certificate to be ready for apps in a review environment';

export async function handler(): Promise<void> {
  const domain = CI_MERGE_REQUEST_IID
    ? `${CI_MERGE_REQUEST_IID}.${APPSEMBLE_REVIEW_DOMAIN || 'appsemble.review'}`
    : APPSEMBLE_STAGING_DOMAIN || 'staging.appsemble.eu';
  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(async () => {
      const { data } = await axios.get<SSLStatusMap>(`https://${domain}/api/ssl`, {
        params: { domains: `wait-for-ssl.appsemble.${domain}` },
      });
      const [status] = Object.values(data);
      logger.info(`SSL status: ${status}`);
      if (status === 'pending') {
        return;
      }
      if (status === 'ready') {
        resolve();
      } else {
        reject(new Error(status));
      }
      clearInterval(interval);
    }, 10_000);
  });
}
