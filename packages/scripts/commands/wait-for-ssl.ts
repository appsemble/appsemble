import { logger } from '@appsemble/node-utils';
import { type SSLStatusMap } from '@appsemble/types';
import axios from 'axios';

const { CI_MERGE_REQUEST_IID } = process.env;

export const command = 'wait-for-ssl';
export const description =
  'Wait for the SSL certificate to be ready for apps in a review environment';

export async function handler(): Promise<void> {
  const reviewDomain = `${CI_MERGE_REQUEST_IID || 'staging'}.appsemble.review`;
  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(async () => {
      const { data } = await axios.get<SSLStatusMap>(`https://${reviewDomain}/api/ssl`, {
        params: { domains: `wait-for-ssl.appsemble.${reviewDomain}` },
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
