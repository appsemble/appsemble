import { join } from 'node:path';

import { authenticate, logger } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { exportAppAsZip } from '../../lib/app.js';
import { type BaseArguments } from '../../types.js';

interface ExportAppArgs extends BaseArguments {
  assets: boolean;
  id: number;
  resources: boolean;
  path?: string;
}
export const command = 'export';
export const description = `Export an app as a zip file using app id.
  App definition, styles, icon and messages are exported by default, to export resources, make sure you have suitable permissions and use the '--resources' flag.
  Similarly for assets use the --assets flag and the assets referenced by the resources will be exported in a separate folder.`;

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
    .option('assets', {
      describe:
        'Boolean representing whether the assets referenced by resources should be exported.',
    })
    .option('path', {
      describe: 'Path of the folder where you want to put your exported file.',
    });
}

export async function handler(args: ExportAppArgs): Promise<void> {
  const { assets, clientCredentials, id: appId, path: outputDirectory, remote, resources } = args;
  const defaultOutputDirectory = join(process.cwd(), 'apps');

  await authenticate(remote, 'apps:export', clientCredentials);

  logger.info(`Exporting app with id: ${appId}`);
  await exportAppAsZip(appId, assets, resources, outputDirectory || defaultOutputDirectory, remote);

  logger.info('Export completed successfully');
}
