import path from 'path';

export const command = 'config';
export const description = 'Commands related to local configurations.';

export function builder(yargs) {
  return yargs.commandDir(path.join(__dirname, 'config'));
}
