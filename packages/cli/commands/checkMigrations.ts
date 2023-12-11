import { type Argv } from 'yargs';

import { serverImport } from '../lib/serverImport.js';
import { type BaseArguments } from '../types.js';

export const command = 'check-migrations';
export const description = 'Helps you with migrations';

export function builder(yargs: Argv): Argv {
  return yargs;
}

export async function handler(argv: BaseArguments): Promise<void> {
  const { checkMigrations, setArgv } = await serverImport('setArgv', 'checkMigrations');
  setArgv(argv);
  return checkMigrations();
}
