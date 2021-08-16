import { commandDirOptions } from '@appsemble/node-utils';
import { Argv } from 'yargs';

export const command = 'team';
export const description = 'Commands related to app teams.';

export function builder(yargs: Argv): Argv {
  return yargs.commandDir(...commandDirOptions(__filename));
}
