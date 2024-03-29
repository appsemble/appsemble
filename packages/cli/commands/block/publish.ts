import { authenticate, logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { type Argv } from 'yargs';

import { buildBlock } from '../../lib/block.js';
import { getProjectBuildConfig } from '../../lib/config.js';
import { publishProject } from '../../lib/project.js';
import { type BaseArguments } from '../../types.js';

interface PublishBlockArguments extends BaseArguments {
  paths: string[];
  build: boolean;
  ignoreConflict: boolean;
}

export const command = 'publish <paths...>';
export const description = 'Publish a block.';

export function builder(yargs: Argv): Argv<any> {
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
}: PublishBlockArguments): Promise<void> {
  await authenticate(remote, 'blocks:write', clientCredentials);

  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });
  logger.info(`Publishing ${directories.length} Blocks`);
  for (const dir of directories) {
    logger.info('');
    const buildConfig = await getProjectBuildConfig(dir);

    if (build) {
      await buildBlock(buildConfig);
    }

    await publishProject(buildConfig, '/api/blocks', ignoreConflict);
  }
}
