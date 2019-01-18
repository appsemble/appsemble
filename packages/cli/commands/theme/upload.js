import logging from 'winston';
import FormData from 'form-data';
import fs from 'fs-extra';
import postcss from 'postcss';
import postcssrc from 'postcss-load-config';
import postcssUrl from 'postcss-url';

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
      type: 'number',
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
  logging.info(`Upload ${type} stylesheet for organization ${organization}`);

  const data = await fs.readFile(file, 'utf8');
  const postcssConfig = await postcssrc();
  const postCss = postcss(postcssConfig).use(postcssUrl({ url: 'inline' }));

  const { css } = await postCss.process(data, { from: file, to: null });
  const formData = new FormData();
  formData.append('style', Buffer.from(css), 'style.css');

  if (block) {
    await post(`/api/organizations/${organization}/style/${type}/${block}`, formData);
  } else {
    await post(`/api/organizations/${organization}/style/${type}`, formData);
  }

  logging.info(`Upload of ${type} stylesheet successful! 🎉`);
}

function determineType(shared, core, block) {
  let type;

  if (shared) {
    type = 'shared';
  }

  if (core) {
    type = 'core';
  }

  if (block) {
    type = 'block';
  }

  return type;
}

export async function handler({ path, organization, shared, core, block }) {
  const themeDir = await fs.stat(path);

  if (themeDir.isDirectory()) {
    logging.info('Traversing directory for themes 🕵');

    const dir = await fs.readdir(path);
    dir.forEach(async subDir => {
      if (
        !subDir.startsWith('@') &&
        subDir.toLowerCase() !== 'core' &&
        subDir.toLowerCase() !== 'shared'
      ) {
        logging.warn(`Skipping directory ${subDir}`);
        return;
      }

      const styleDir = await fs.readdir(`${path}/${subDir}`);

      if (subDir.toLowerCase() === 'core' || subDir.toLowerCase() === 'shared') {
        if (!styleDir.some(styleSubDir => styleSubDir.toLowerCase() === 'index.css')) {
          logging.warn(`No index.css found, skipping directory ${subDir}`);
          return;
        }

        await handleUpload(`${path}/${subDir}/index.css`, organization, subDir.toLowerCase());
        return;
      }

      // Subdirectory is an @organization directory
      styleDir
        .filter(styleSub => fs.lstatSync(`${path}/${subDir}/${styleSub}`).isDirectory())
        .forEach(async styleSubDir => {
          const blockStyleDir = await fs.readdir(`${path}/${subDir}/${styleSubDir}`);
          if (
            !blockStyleDir.some(
              blockStyleDirFile => blockStyleDirFile.toLowerCase() === 'index.css',
            )
          ) {
            logging.warn(`No index.css found, skipping directory ${subDir}`);
            return;
          }

          await handleUpload(
            `${path}/${subDir}/${styleSubDir}/index.css`,
            organization,
            'block',
            `${subDir}/${styleSubDir}`,
          );
        });
    });

    logging.info('All done! 👋');
    return;
  }

  // Path was not a directory, assume it's a file
  const type = determineType(shared, core, block);
  if (!type) {
    throw Error(
      'When uploading individual themes, at least one of the following options must be provided: shared / core / block.',
    );
  }

  await handleUpload(path, organization, determineType(shared, core, block), block);
}
