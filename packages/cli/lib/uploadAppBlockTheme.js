import { logger } from '@appsemble/node-utils';
import FormData from 'form-data';

import processCss from './processCss';
import { post } from './request';

/**
 * Uploads an app block theme
 *
 * @param {string} filePath The path of the index.css file
 * @param {string} organization The ID of the organization the block belongs to.
 * @param {string} appId The ID of the app to upload the theme for.
 * @param {string} block The name of the block.
 */
export default async function uploadAppBlockTheme(filePath, organization, appId, block) {
  logger.info(`Upload ${organization}/${block} stylesheet for app ${appId}`);

  const css = await processCss(filePath);
  const formData = new FormData();
  formData.append('style', Buffer.from(css), 'style.css');

  await post(`/api/apps/${appId}/style/block/${organization}/${block}`, formData);

  logger.info(`Upload of ${organization}/${block} stylesheet successful! 🎉`);
}
