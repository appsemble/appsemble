import { type Argv, type CommandModule } from 'yargs';

import * as add from './add.js';

export { noop as handler } from '@appsemble/utils';

export const command = 'member';
export const description = 'Commands related to organization members.';

export function builder(yargs: Argv): Argv {
  return yargs.command(add as unknown as CommandModule).demandCommand(1);
}
