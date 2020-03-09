import path from 'path';

export const command = 'auth';
export const description = 'Commands related authorization using OAuth2.';

export function builder(yargs) {
  return yargs.commandDir(path.join(__dirname, 'auth'));
}
