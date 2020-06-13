import { commandDirOptions } from '@appsemble/node-utils';
import type { Argv } from 'yargs';

export const command = 'block';
export const description = 'Commands related to blocks.';

export function builder(yargs: Argv): Argv {
  return yargs.commandDir(...commandDirOptions(__filename));
}
