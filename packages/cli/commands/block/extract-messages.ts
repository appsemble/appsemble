import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { type Argv } from 'yargs';

import { getBlockConfig, processBlockMessages } from '../../lib/block.js';
import { type BaseArguments } from '../../types.js';

interface BuildBlockArguments extends BaseArguments {
  paths: string[];
  languages: string[];
}

export const command = 'extract-messages <paths...>';
export const description = 'Extract messages from a block.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('paths', {
      describe: 'The paths to the blocks to extract messages from.',
    })
    .option('languages', {
      type: 'array',
      describe: 'The languages to extract.',
      default: [],
    });
}

export async function handler({ languages, paths }: BuildBlockArguments): Promise<void> {
  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });
  const langs = [...new Set(['en', ...languages.map((language) => language.toLowerCase())])];
  logger.info(`Extracting messages from ${directories.length} Blocks`);
  for (const dir of directories) {
    logger.info('');
    const config = await getBlockConfig(dir);
    logger.info(`Processing ${config.name}`);

    await processBlockMessages(config, langs);
  }
}
