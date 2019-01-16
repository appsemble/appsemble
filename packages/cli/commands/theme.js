import path from 'path';

export const command = 'theme';
export const description = 'Commands related to themes.';

export function builder(yargs) {
  return yargs.commandDir(path.join(__dirname, 'theme'));
}
