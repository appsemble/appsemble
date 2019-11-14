import path from 'path';

export const command = 'app';
export const description = 'Commands related to apps.';

export function builder(yargs) {
  return yargs.commandDir(path.join(__dirname, 'app'));
}
