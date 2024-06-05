import { type Argv } from 'yargs';

import { serverImport } from '../lib/serverImport.js';
import { type BaseArguments } from '../types.js';

export const command = 'check-down-migrations';
export const description =
  'Checks that the down migrations are defined correctly and match when migrating up to the previous migration';

export function builder(yargs: Argv): Argv {
  return yargs;
}

export async function handler(argv: BaseArguments): Promise<void> {
  const { checkDownMigrations, setArgv } = await serverImport('setArgv', 'checkDownMigrations');
  setArgv(argv);
  return checkDownMigrations();
}
