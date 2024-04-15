import { logger } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { deleteBlock } from '../../lib/block.js';
import { type BaseArguments } from '../../types.js';

interface DeleteBlockArguments extends BaseArguments {
  block: string;
  organization: string;
}

export const command = 'delete <block>';
export const description =
  'Delete a specific block version. Using this outside local development is discouraged.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('block', {
      describe: 'Blockname and version to be deleted',
    })
    .option('organization', {
      describe: 'Organization to which the block belongs.',
      default: 'appsemble',
    });
}

export async function handler({
  block,
  clientCredentials,
  organization,
  remote,
}: DeleteBlockArguments): Promise<void> {
  const [blockName, blockVersion] = block.split(':');
  logger.info(`Deleting Block ${block}`);
  await deleteBlock({ organization, blockName, blockVersion, remote, clientCredentials });
}
