import { has } from '@appsemble/utils';
import readPkgUp from 'read-pkg-up';
import { Argv } from 'yargs';

import { BaseArguments, MonoRepoPackageJson } from '../../types';

interface ConfigGetArguments extends BaseArguments {
  key: string;
}

export const command = 'get <key>';
export const description = 'Get an Appsemble configuration option from package.json.';

export function builder(yargs: Argv): Argv<any> {
  return yargs.positional('key', {
    describe: 'The key whose value to get',
  });
}

export async function handler({ key }: ConfigGetArguments): Promise<void> {
  const { packageJson } = await readPkgUp({ normalize: false });
  if (has(packageJson, 'appsembleServer')) {
    // eslint-disable-next-line no-console
    console.log((packageJson as MonoRepoPackageJson).appsembleServer[key]);
  }
}
