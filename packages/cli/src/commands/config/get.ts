import readPkgUp from 'read-pkg-up';
import type { Argv } from 'yargs';

import type { BaseArguments, MonoRepoPackageJson } from '../../types';

interface ConfigGetArguments extends BaseArguments {
  key: string;
}

export const command = 'get <key>';
export const description = 'Get an Appsemble configuration option from package.json.';

export function builder(yargs: Argv): Argv {
  return yargs.positional('key', {
    describe: 'The key whose value to get',
  });
}

export async function handler({ key }: ConfigGetArguments): Promise<void> {
  const { packageJson } = await readPkgUp({ normalize: false });
  if (Object.hasOwnProperty.call(packageJson, 'appsembleServer')) {
    // eslint-disable-next-line no-console
    console.log((packageJson as MonoRepoPackageJson).appsembleServer[key]);
  }
}
