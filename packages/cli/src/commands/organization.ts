import { commandDirOptions } from '@appsemble/node-utils';
import { Argv } from 'yargs';

export const command = 'organization';
export const description = 'Commands related to organizations.';

export function builder(yargs: Argv): Argv {
  return yargs.commandDir(...commandDirOptions(__filename));
}
