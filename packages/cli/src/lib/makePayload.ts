import { logger } from '@appsemble/node-utils';
import * as FormData from 'form-data';
import * as fs from 'fs-extra';
import * as klaw from 'klaw';
import * as path from 'path';

import { BlockConfig } from '../types';
import generateBlockData from './generateBlockData';

interface MakePayloadParams {
  /**
   * The block configuration
   */
  config: BlockConfig;

  /**
   * The path in which the block project is located.
   */
  path: string;
}

/**
 * Configure the payload for a new block version upload.
 *
 * @returns The payload that should be sent to the version endpoint.
 */
export default async function makePayload({
  config,
  path: p,
}: MakePayloadParams): Promise<FormData> {
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
