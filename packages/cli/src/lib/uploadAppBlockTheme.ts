import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';

import { processCss } from './processCss';

/**
 * Uploads an app block theme
 *
 * @param filePath - The path of the index.css file
 * @param organization - The ID of the organization the block belongs to.
 * @param appId - The ID of the app to upload the theme for.
 * @param block - The name of the block.
 */
export async function uploadAppBlockTheme(
  filePath: string,
  organization: string,
  appId: number,
  block: string,
): Promise<void> {
  logger.info(`Upload ${organization}/${block} stylesheet for app ${appId}`);

  const css = await processCss(filePath);
  const formData = new FormData();
  formData.append('style', Buffer.from(css), 'style.css');

  await axios.post(`/api/apps/${appId}/style/block/${organization}/${block}`, formData);

  logger.info(`Upload of ${organization}/${block} stylesheet successful! 🎉`);
}
