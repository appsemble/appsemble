import { logger } from '@appsemble/node-utils';
import FormData from 'form-data';
import fs from 'fs-extra';
import klaw from 'klaw';
import path from 'path';

import generateBlockData from './generateBlockData';

/**
 * Configure the payload for a new block version upload.
 *
 * @param {Object} params
 * @param {Object} params.config The block configuration
 * @param {string} params.path The path in which the block project is located.
 * @returns {FormData} The payload that should be sent to the version endpoint.
 */
export default async function makePayload({ config, path: p }) {
  const { output } = config;
  const distPath = output ? path.resolve(p, output) : p;
  const form = new FormData();
  const data = generateBlockData(config, p);
  form.append('data', JSON.stringify(data));
  return new Promise((resolve, reject) => {
    klaw(distPath)
      .on('data', file => {
        if (!file.stats.isFile()) {
          return;
        }
        const key = path.relative(distPath, file.path);
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
