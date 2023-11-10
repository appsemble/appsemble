import { join } from 'node:path';

import { authenticate, logger } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { exportAppAsZip } from '../../lib/app.js';
import { type BaseArguments } from '../../types.js';

interface ExportAppArgs extends BaseArguments {
  id: number;
  resources: boolean;
  path?: string;
}
export const command = 'export';
export const description = `Export an app as a zip file using app id.
  App definition, styles and messages are exported by default, to export resources, make sure you have suitable permissions and use the '--resources' flag.`;

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .option('id', {
      describe: 'Id of the app to be exported as a zip file',
      demandOption: true,
    })
    .option('resources', {
      describe: 'Boolean representing whether the resources should be exported or not',
      default: false,
    })
    .option('path', {
      describe: 'Path of the folder where you want to put your exported file.',
    });
}

export async function handler(args: ExportAppArgs): Promise<void> {
  const { clientCredentials, id: appId, path: outputDirectory, remote, resources } = args;
  const defaultOutputDirectory = join(process.cwd(), 'apps');

  await authenticate(remote, 'apps:export', clientCredentials);

  logger.info(`Exporting app with id: ${appId}`);
  await exportAppAsZip(appId, resources, outputDirectory || defaultOutputDirectory, remote);

  logger.info('Export completed successfully');
}
