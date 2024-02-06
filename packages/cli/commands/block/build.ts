import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { type Argv } from 'yargs';

import { getProjectBuildConfig } from '../../lib/config.js';
import { buildProject } from '../../lib/project.js';
import { type BaseArguments } from '../../types.js';

interface BuildBlockArguments extends BaseArguments {
  paths: string[];
}

export const command = 'build <paths...>';
export const description = 'Build a block without publishing.';

export function builder(yargs: Argv): Argv<any> {
  return yargs.positional('paths', {
    describe: 'The paths to the blocks to build.',
  });
}

export async function handler({ paths }: BuildBlockArguments): Promise<void> {
  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });
  logger.info(`Building ${directories.length} Blocks`);
  for (const dir of directories) {
    logger.info('');
    const buildConfig = await getProjectBuildConfig(dir);

    await buildProject(buildConfig);
  }
}
