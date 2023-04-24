import { has } from '@appsemble/utils';
import { readPackageUp } from 'read-pkg-up';
import { type Argv } from 'yargs';

import { type BaseArguments, type MonoRepoPackageJson } from '../../types.js';

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
  const { packageJson } = await readPackageUp({ normalize: false });
  const pkg = packageJson as MonoRepoPackageJson;
  if (has(pkg, 'appsembleServer')) {
    // eslint-disable-next-line no-console
    console.log(pkg.appsembleServer[key]);
  }
}
