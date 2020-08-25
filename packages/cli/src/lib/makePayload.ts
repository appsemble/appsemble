import { createReadStream, promises as fs } from 'fs';
import { join, relative, resolve } from 'path';
import { inspect } from 'util';

import { logger } from '@appsemble/node-utils';
import FormData from 'form-data';
import klaw from 'klaw';

import type { BlockConfig } from '../types';
import { getBlockConfigFromTypeScript } from './getBlockConfigFromTypeScript';

/**
 * Configure the payload for a new block version upload.
 *
 * @param config - The block configuration
 * @returns The payload that should be sent to the version endpoint.
 */
export async function makePayload(config: BlockConfig): Promise<FormData> {
  const { dir, output } = config;
  const distPath = resolve(dir, output);
  const form = new FormData();
  const { description, layout, longDescription, name, resources, version } = config;
  const { actions, events, parameters } = getBlockConfigFromTypeScript(config);
  const files = await fs.readdir(dir);
  const icon = files.find((entry) => entry.match(/^icon\.(png|svg)$/));

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
  append('longDescription', longDescription);
  append('events', events);
  append('layout', layout);
  append('name', name);
  append('resources', resources);
  append('parameters', parameters);
  append('version', version);

  if (icon) {
    const iconPath = join(dir, icon);
    logger.info(`Using icon: ${iconPath}`);
    form.append('icon', createReadStream(iconPath));
  }

  return new Promise((resolveForm, reject) => {
    klaw(distPath)
      .on('data', (file) => {
        if (!file.stats.isFile()) {
          return;
        }
        const relativePath = relative(distPath, file.path);
        const realPath = relative(process.cwd(), relativePath);
        logger.info(`Adding file: “${realPath}” as “${relativePath}”`);
        form.append('files', createReadStream(file.path), {
          filename: encodeURIComponent(relativePath),
        });
      })
      .on('error', reject)
      .on('end', () => {
        resolveForm(form);
      });
  });
}
