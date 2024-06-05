import { type Argv } from 'yargs';

import { serverImport } from '../lib/serverImport.js';
import { type BaseArguments } from '../types.js';

export const command = 'fuzz-migrations';
export const description = 'Fuzz migrations to find inconcistencies';

export function builder(yargs: Argv): Argv {
  return yargs;
}

export async function handler(argv: BaseArguments): Promise<void> {
  const { fuzzMigrations, setArgv } = await serverImport('setArgv', 'fuzzMigrations');
  setArgv(argv);
  return fuzzMigrations();
}
