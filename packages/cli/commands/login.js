import path from 'path';

export const command = 'login';
export const description = 'Commands related to authentication.';

export function builder(yargs) {
  return yargs.commandDir(path.join(__dirname, 'login'));
}
