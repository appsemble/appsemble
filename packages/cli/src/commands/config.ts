import path from 'path';
import type { Argv } from 'yargs';

export const command = 'config';
export const description = 'Commands related to local configurations.';

export function builder(yargs: Argv): Argv {
  return yargs.commandDir(path.join(__dirname, 'config'));
}
