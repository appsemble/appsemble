import { type Argv } from 'yargs';

import { serverImport } from '../lib/serverImport.js';
import { type BaseArguments } from '../types.js';

export const command = 'check-migrations';
export const description =
  'Checks that migrations are defined correctly and match what is defined by models';

export function builder(yargs: Argv): Argv {
  return yargs;
}

export async function handler(argv: BaseArguments): Promise<void> {
  const { checkMigrations, setArgv } = await serverImport('setArgv', 'checkMigrations');
  setArgv(argv);
  return checkMigrations();
}
