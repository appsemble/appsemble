import { readFile } from 'node:fs/promises';

import { authenticate, logger } from '@appsemble/node-utils';
import axios from 'axios';
import { type Argv } from 'yargs';

import { type BaseArguments } from '../../types.js';

interface ImportAppArgs extends BaseArguments {
  organization: string;
  path: string;
}
export const command = 'import <path>';
export const description =
  'Import an app from a zip file using organization id. App definition, styles, resources and messages can be imported from the zip file.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('path', {
      describe: 'Path of the zip file you want to import.',
      required: true,
    })
    .option('organization', {
      describe: 'Id of the organization to which app will be imported.',
      demandOption: true,
    });
}

export async function handler(args: ImportAppArgs): Promise<void> {
  const { clientCredentials, organization, path: inputFile, remote } = args;

  const [, extName] = inputFile.split('.');
  if (extName !== 'zip') {
    logger.error('Input file must be a zip file.');
    return;
  }

  await authenticate(remote, 'apps:write', clientCredentials);

  logger.info(`Importing app to organization: ${organization}`);
  const zipFile = await readFile(inputFile);
  const config = {
    base: remote,
    headers: {
      'Content-Type': 'application/zip',
    },
  };
  await axios.post(`/api/apps/import/organization/${organization}`, zipFile, config);

  logger.info('Importing app completed successfully');
}
