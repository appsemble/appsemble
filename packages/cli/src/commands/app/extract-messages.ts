import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { Argv } from 'yargs';

import { writeAppMessages } from '../../lib/app';
import { BaseArguments } from '../../types';

interface BuildBlockArguments extends BaseArguments {
  paths: string[];
  languages: string[];
  verify: true;
}

export const command = 'extract-messages <paths...>';
export const description = 'Extract messages from a block.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('paths', {
      describe: 'The paths to the apps to extract messages from.',
    })
    .option('languages', {
      type: 'array',
      describe: 'The languages to extract.',
      default: [],
    })
    .option('verify', {
      type: 'boolean',
      describe: 'If specified, the CLI will fail if a missing translation is found',
    });
}

export async function handler({ languages, paths, verify }: BuildBlockArguments): Promise<void> {
  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });
  // Const langs = [...new Set(['en', ...languages.map((language) => language.toLowerCase())])];
  logger.info(`Extracting messages from ${directories.length} apps`);
  for (const dir of directories) {
    await writeAppMessages(dir, languages, verify);
  }
}
