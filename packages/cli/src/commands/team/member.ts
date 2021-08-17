import { commandDirOptions } from '@appsemble/node-utils';
import { Argv } from 'yargs';

export const command = 'member';
export const description = 'Commands related to app team members.';

export function builder(yargs: Argv): Argv {
  return yargs.commandDir(...commandDirOptions(__filename));
}
