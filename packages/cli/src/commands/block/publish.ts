import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { buildBlock } from '../../lib/buildBlock';
import { getBlockConfig } from '../../lib/getBlockConfig';
import { publishBlock } from '../../lib/publishBlock';
import { BaseArguments } from '../../types';

interface BuildBlockArguments extends BaseArguments {
  paths: string[];
  build: boolean;
  ignoreConflict: boolean;
}

export const command = 'publish <paths...>';
export const description = 'Publish a block.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('paths', {
      describe: 'The paths to the blocks to publish.',
    })
    .option('build', {
      alias: 'b',
      describe: 'If specified, builds the block with webpack before publishing it.',
      type: 'boolean',
      default: true,
    })
    .option('ignore-conflict', {
      describe: 'If specified, conflicts with an existing block version are ignored.',
      type: 'boolean',
    });
}

export async function handler({
  build,
  clientCredentials,
  ignoreConflict,
  paths,
  remote,
}: BuildBlockArguments): Promise<void> {
  await authenticate(remote, 'blocks:write', clientCredentials);

  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });
  logger.info(`Publishing ${directories.length} Blocks`);
  for (const dir of directories) {
    logger.info('');
    const config = await getBlockConfig(dir);

    if (build) {
      await buildBlock(config);
    }

    await publishBlock(config, ignoreConflict);
  }
}
