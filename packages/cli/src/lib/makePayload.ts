import { logger } from '@appsemble/node-utils';
import FormData from 'form-data';
import fs from 'fs-extra';
import klaw from 'klaw';
import path from 'path';
import { inspect } from 'util';

import type { BlockConfig } from '../types';
import getBlockConfigFromTypeScript from './getBlockConfigFromTypeScript';

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
  const { description, layout, name, resources, version } = config;
  const { actions, events, parameters } = getBlockConfigFromTypeScript(config, p);

  function append(field: string, value: any): void {
    if (value) {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      logger.verbose(`Using ${field}: ${inspect(value, { colors: true, depth: 20 })}`);
      form.append(field, serialized);
    } else {
      logger.silly(`Skipping parameter ${field}`);
    }
  }

  append('actions', actions);
  append('description', description);
  append('events', events);
  append('layout', layout);
  append('name', name);
  append('resources', resources);
  append('parameters', parameters);
  append('version', version);

  return new Promise((resolve, reject) => {
    klaw(distPath)
      .on('data', (file) => {
        if (!file.stats.isFile()) {
          return;
        }
        const relativePath = path.relative(distPath, file.path);
        const realPath = path.relative(process.cwd(), relativePath);
        logger.info(`Adding file: “${realPath}” as “${relativePath}”`);
        form.append('files', fs.createReadStream(file.path), {
          filename: encodeURIComponent(relativePath),
        });
      })
      .on('error', reject)
      .on('end', () => {
        resolve(form);
      });
  });
}
