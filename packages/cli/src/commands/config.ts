import { commandDirOptions } from '@appsemble/node-utils';
import { Argv } from 'yargs';

export const command = 'config';
export const description = 'Commands related to local configurations.';

export function builder(yargs: Argv): Argv {
  return yargs.commandDir(...commandDirOptions(__filename));
}
