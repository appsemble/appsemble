import { logger } from '@appsemble/node-utils';
import fg from 'fast-glob';
import normalizePath from 'normalize-path';
import { type Argv } from 'yargs';

import { writeAppMessages } from '../../lib/app.js';
import { type BaseArguments } from '../../types.js';

interface BuildBlockArguments extends BaseArguments {
  paths: string[];
  languages: string;
  verify: string;
  format: 'json' | 'yaml';
}

export const command = 'extract-messages <paths...>';
export const description = 'Extract messages from an app.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('paths', {
      describe: 'The paths to the apps to extract messages from.',
    })
    .option('languages', {
      describe: 'The languages to extract as a comma separated list.',
    })
    .option('format', {
      describe: 'The format that should be used for the output.',
      type: 'string',
      choices: ['yaml', 'json'],
      default: 'json',
    })
    .option('verify', {
      describe:
        'A comma separated list of languages to verify. The CLI will fail if a message is missing for one of the given languages',
    });
}

export async function handler({
  format = 'json',
  languages = '',
  paths,
  verify = '',
}: BuildBlockArguments): Promise<void> {
  const normalizedPaths = paths.map((path) => normalizePath(path));
  const directories = await fg(normalizedPaths, { absolute: true, onlyDirectories: true });
  logger.info(`Extracting messages from ${directories.length} apps`);
  for (const dir of directories) {
    await writeAppMessages(
      dir,
      languages.split(',').filter(Boolean),
      verify.split(',').filter(Boolean),
      format,
    );
  }
}
