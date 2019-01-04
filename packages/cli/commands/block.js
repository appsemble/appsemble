import path from 'path';

export const command = 'block';
export const description = 'Commands related to blocks.';

export function builder(yargs) {
  return yargs.commandDir(path.join(__dirname, 'block'));
}
