import logging from 'winston';
import FormData from 'form-data';
import fs from 'fs-extra';
import postcss from 'postcss';
import postcssrc from 'postcss-load-config';

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
    .option('type', {
      desc: 'Type of stylesheet to upload.',
      choices: ['shared', 'core'],
      demand: true,
    });
}

export async function handler({ path, organization, type }) {
  logging.info(`Upload ${type} stylesheet for organization ${organization}`);

  const data = await fs.readFile(path, 'utf8');
  const postcssConfig = await postcssrc();
  const { css } = await postcss(postcssConfig).process(data, { from: null, to: null });
  const formData = new FormData();
  formData.append('style', Buffer.from(css), 'style.css');

  await post(`/api/organizations/${organization}/style/${type}`, formData);
  logging.info(`Upload of ${type} stylesheet successful! 🎉`);
}
