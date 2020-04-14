import path from 'path';
import type { Argv } from 'yargs';

export const command = 'block';
export const description = 'Commands related to blocks.';

export function builder(yargs: Argv): Argv {
  return yargs.commandDir(path.join(__dirname, 'block'), { extensions: ['js', 'ts'] });
}
