import { logger } from '@appsemble/node-utils';
import FormData from 'form-data';
import fs from 'fs-extra';
import { join } from 'path';

import { getToken } from '../../lib/config';
import processCss from '../../lib/processCss';
import { post } from '../../lib/request';

export const command = 'upload <path>';
export const description = 'Upload stylesheets to an organization.';

export function builder(yargs) {
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

async function handleUpload(file, organization, type, block) {
  logger.info(`Upload ${type} stylesheet for organization ${organization}`);

  const css = await processCss(file);
  const formData = new FormData();
  formData.append('style', Buffer.from(css), 'style.css');

  if (block) {
    await post(`/api/organizations/${organization}/style/${type}/${block}`, formData);
  } else {
    await post(`/api/organizations/${organization}/style/${type}`, formData);
  }

  logger.info(`Upload of ${type} stylesheet successful! 🎉`);
}

function determineType(shared, core, block) {
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

export async function handler({ path, organization, shared, core, block, remote }) {
  const themeDir = await fs.stat(path);
  await getToken(remote);

  if (themeDir.isFile()) {
    // Path was not a directory, assume it's a file
    const type = determineType(shared, core, block);
    if (!type) {
      throw Error(
        'When uploading individual themes, at least one of the following options must be provided: shared / core / block.',
      );
    }

    await handleUpload(path, organization, determineType(shared, core, block), block);
    return;
  }

  logger.info('Traversing directory for themes 🕵');

  const dir = await fs.readdir(path);
  await dir.reduce(async (acc, subDir) => {
    await acc;
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
      const indexCss = styleDir.find(fname => fname.toLowerCase() === 'index.css');
      if (!indexCss) {
        logger.warn(`No index.css found, skipping directory ${subDir}`);
        return;
      }

      await handleUpload(join(path, subDir, indexCss), organization, subDir.toLowerCase());
      return;
    }

    // Subdirectory is an @organization directory
    await styleDir
      .filter(styleSub => fs.lstatSync(join(path, subDir, styleSub)).isDirectory())
      .reduce(async (accumulator, styleSubDir) => {
        await accumulator;
        const blockStyleDir = await fs.readdir(join(path, subDir, styleSubDir));
        const subIndexCss = blockStyleDir.find(fname => fname.toLowerCase() === 'index.css');
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
      }, null);
  }, null);

  logger.info('All done! 👋');
}
