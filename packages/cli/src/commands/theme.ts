import { commandDirOptions } from '@appsemble/node-utils';
import type { Argv } from 'yargs';

export const command = 'theme';
export const description = 'Commands related to themes.';

export function builder(yargs: Argv): Argv {
  return yargs.commandDir(...commandDirOptions(__filename));
}
