import { logger } from '@appsemble/node-utils';
import FormData from 'form-data';
import fs from 'fs';
import klaw from 'klaw';
import { pick } from 'lodash';
import path from 'path';

/**
 * Configure the payload for a new block version upload.
 *
 * @param {Object} params
 * @param {Object} params.config The block configuration
 * @param {string} params.path The path in which the block project is located.
 * @returns {FormData} The payload that should be sent to the version endpoint.
 */
export default async function makePayload({ config, path: p }) {
  const fullPath = config.output ? path.resolve(p, config.output) : p;
  const form = new FormData();
  form.append('data', JSON.stringify(pick(config, ['actions', 'layout', 'resources', 'version'])));
  return new Promise((resolve, reject) => {
    klaw(fullPath)
      .on('data', file => {
        if (!file.stats.isFile()) {
          return;
        }
        const key = path.relative(fullPath, file.path);
        const realPath = path.relative(process.cwd(), file.path);
        logger.info(`Adding file: “${realPath}” as “${key}”`);
        form.append(key, fs.createReadStream(file.path));
      })
      .on('error', reject)
      .on('end', () => {
        resolve(form);
      });
  });
}
