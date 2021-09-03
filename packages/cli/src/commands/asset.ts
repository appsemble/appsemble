import { commandDirOptions } from '@appsemble/node-utils';
import { Argv } from 'yargs';

export const command = 'asset';
export const description = 'Commands related to app assets.';

export function builder(yargs: Argv): Argv {
  return yargs.commandDir(...commandDirOptions(__filename));
}
