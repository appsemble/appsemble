import { commandDirOptions } from '@appsemble/node-utils';
import type { Argv } from 'yargs';

export const command = 'auth';
export const description = 'Commands related authorization using OAuth2.';

export function builder(yargs: Argv): Argv {
  return yargs.commandDir(...commandDirOptions(__filename));
}
