import { inspect } from 'util';

import { logger, writeData } from '@appsemble/node-utils';
import { has } from '@appsemble/utils';
import readPkgUp from 'read-pkg-up';
import { Argv } from 'yargs';

import { BaseArguments, MonoRepoPackageJson } from '../../types.js';

interface ConfigSetArguments extends BaseArguments {
  key: string;
  value: string;
}

export const command = 'set <key> <value>';
export const description = 'Set an Appsemble configuration option in package.json.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('key', {
      describe: 'The key whose value to set',
    })
    .positional('value', {
      describe: 'The value to set',
    });
}

export async function handler({ key, value }: ConfigSetArguments): Promise<void> {
  const { packageJson, path } = await readPkgUp({ normalize: false });
  if (!has(packageJson, 'appsembleServer')) {
    packageJson.appsembleServer = {};
  }
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    parsed = value;
  }
  (packageJson as MonoRepoPackageJson).appsembleServer[key] = parsed;
  await writeData(path, packageJson);
  logger.info(
    `Set option appsembleServer.${key} to ${inspect(parsed, { colors: true })} in ${path}`,
  );
}
