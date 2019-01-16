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
    })
    .check(argv => {
      if (!(argv.shared || argv.core || argv.block)) {
        return 'At least one of the following options must be provided: shared / core / block.';
      }
      return true;
    });
}

export async function handler({ path, organization, shared, core, block }) {
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

  logging.info(`Upload ${type} stylesheet for organization ${organization}`);

  const data = await fs.readFile(path, 'utf8');
  const postcssConfig = await postcssrc();
  const postCss = postcss(postcssConfig).use(postcssUrl({ url: 'inline' }));

  const { css } = await postCss.process(data, { from: path, to: null });
  const formData = new FormData();
  formData.append('style', Buffer.from(css), 'style.css');

  if (block) {
    await post(`/api/organizations/${organization}/style/${type}/${block}`, formData);
  } else {
    await post(`/api/organizations/${organization}/style/${type}`, formData);
  }

  logging.info(`Upload of ${type} stylesheet successful! 🎉`);
}
