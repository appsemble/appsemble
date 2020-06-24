import { commandDirOptions } from '@appsemble/node-utils';
import type { Argv } from 'yargs';

export const command = 'app';
export const description = 'Commands related to apps.';

export function builder(yargs: Argv): Argv {
  return yargs.commandDir(...commandDirOptions(__filename));
}
