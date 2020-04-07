import path from 'path';
import type { Argv } from 'yargs';

export const command = 'app';
export const description = 'Commands related to apps.';

export function builder(yargs: Argv): Argv {
  return yargs.commandDir(path.join(__dirname, 'app'), { extensions: ['js', 'ts'] });
}
