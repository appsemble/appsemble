import { promises as fs, lstatSync } from 'fs';
import { join } from 'path';

import { logger } from '@appsemble/node-utils';
import axios from 'axios';
import FormData from 'form-data';
import type { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { processCss } from '../../lib/processCss';
import type { BaseArguments } from '../../types';

interface UploadThemeArguments extends BaseArguments {
  path: string;
  organization: string;
  shared: boolean;
  core: boolean;
  block: string;
}

export const command = 'upload <path>';
export const description = 'Upload stylesheets to an organization.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('path', {
      describe: 'The path to the stylesheet to upload.',
      normalize: true,
    })
    .option('organization', {
      desc: 'Id of the organization to upload to',
      demand: true,
    })
    .option('shared', {
      desc: 'Upload a shared type stylesheet.',
      type: 'boolean',
      conflicts: ['core', 'block'],
    })
    .option('core', {
      desc: 'Upload a core type stylesheet.',
      type: 'boolean',
      conflicts: ['shared', 'block'],
    })
    .option('block', {
      desc: 'The block to upload the stylesheet for.',
      type: 'string',
      conflicts: ['shared', 'core'],
    });
}

async function handleUpload(
  file: string,
  organization: string,
  type: string,
  block?: string,
): Promise<void> {
  logger.info(`Upload ${type} stylesheet for organization ${organization}`);

  const css = await processCss(file);
  const formData = new FormData();
  formData.append('style', Buffer.from(css), 'style.css');

  if (block) {
    await axios.post(`/api/organizations/${organization}/style/${type}/${block}`, formData);
  } else {
    await axios.post(`/api/organizations/${organization}/style/${type}`, formData);
  }

  logger.info(`Upload of ${type} stylesheet successful! 🎉`);
}

function determineType(
  shared: boolean,
  core: boolean,
  block: string,
): 'block' | 'core' | 'shared' | null {
  if (shared) {
    return 'shared';
  }

  if (core) {
    return 'core';
  }

  if (block) {
    return 'block';
  }

  return null;
}

export async function handler({
  block,
  clientCredentials,
  core,
  organization,
  path,
  remote,
  shared,
}: UploadThemeArguments): Promise<void> {
  const themeDir = await fs.stat(path);
  await authenticate(remote, 'organizations:styles:write', clientCredentials);

  if (themeDir.isFile()) {
    // Path was not a directory, assume it's a file
    const type = determineType(shared, core, block);
    if (!type) {
      throw new Error(
        'When uploading individual themes, at least one of the following options must be provided: shared / core / block.',
      );
    }

    await handleUpload(path, organization, determineType(shared, core, block), block);
    return;
  }

  logger.info('Traversing directory for themes 🕵');

  const dir = await fs.readdir(path);
  for (const subDir of dir) {
    if (
      !subDir.startsWith('@') &&
      subDir.toLowerCase() !== 'core' &&
      subDir.toLowerCase() !== 'shared'
    ) {
      logger.warn(`Skipping directory ${subDir}`);
      return;
    }

    const styleDir = await fs.readdir(join(path, subDir));

    if (subDir.toLowerCase() === 'core' || subDir.toLowerCase() === 'shared') {
      const indexCss = styleDir.find((fname) => fname.toLowerCase() === 'index.css');
      if (!indexCss) {
        logger.warn(`No index.css found, skipping directory ${subDir}`);
        return;
      }

      await handleUpload(join(path, subDir, indexCss), organization, subDir.toLowerCase());
      return;
    }

    // Subdirectory is an @organization directory
    for (const styleSubDir of styleDir.filter((styleSub) =>
      lstatSync(join(path, subDir, styleSub)).isDirectory(),
    )) {
      const blockStyleDir = await fs.readdir(join(path, subDir, styleSubDir));
      const subIndexCss = blockStyleDir.find((fname) => fname.toLowerCase() === 'index.css');
      if (!subIndexCss) {
        logger.warn(`No index.css found, skipping directory ${join(path, subDir, styleSubDir)}`);
        return;
      }

      await handleUpload(
        join(path, subDir, styleSubDir, subIndexCss),
        organization,
        'block',
        `${subDir}/${styleSubDir}`,
      );
    }
  }

  logger.info('All done! 👋');
}
