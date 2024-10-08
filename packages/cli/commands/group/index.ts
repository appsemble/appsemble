import { type Argv, type CommandModule } from 'yargs';

import * as create from './create.js';
import * as deleteGroup from './delete.js';
import * as member from './member/index.js';
import * as update from './update.js';

export { noop as handler } from '@appsemble/utils';

export const command = 'group';
export const description = 'Commands related to app groups.';

export function builder(yargs: Argv): Argv {
  return yargs
    .command(create as unknown as CommandModule)
    .command(deleteGroup as unknown as CommandModule)
    .command(member)
    .command(update as unknown as CommandModule)
    .demandCommand(1);
}
