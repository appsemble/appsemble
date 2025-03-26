import { join } from 'node:path';

import { logger } from '@appsemble/node-utils';
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
  Similarly for assets use the --assets flag to include assets in the export.`;

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .option('id', {
      describe: 'Id of the app to be exported as a zip file',
      demandOption: true,
    })
    .option('resources', {
      describe: 'Boolean representing whether the resources should be exported or not',
    })
    .option('assets', {
      describe: 'Boolean representing whether assets should be exported.',
    })
    .option('path', {
      describe: 'Path of the folder where you want to put your exported file.',
    });
}

export async function handler(args: ExportAppArgs): Promise<void> {
  const {
    assets = false,
    clientCredentials,
    id: appId,
    path: outputDirectory,
    remote,
    resources = false,
  } = args;
  const defaultOutputDirectory = join(process.cwd(), 'apps');

  logger.info(`Exporting app with id: ${appId}`);
  await exportAppAsZip(
    clientCredentials ?? '',
    appId,
    assets,
    resources,
    outputDirectory || defaultOutputDirectory,
    remote,
  );

  logger.info('Export completed successfully');
}
