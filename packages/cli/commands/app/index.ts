import { Argv, CommandModule } from 'yargs';

import * as create from './create.js';
import * as extractMessages from './extract-messages.js';
import * as update from './update.js';

export { noop as handler } from '@appsemble/utils';

export const command = 'app';
export const description = 'Commands related to apps.';

export function builder(yargs: Argv): Argv {
  return yargs
    .command(create as unknown as CommandModule)
    .command(extractMessages as unknown as CommandModule)
    .command(update as unknown as CommandModule)
    .demandCommand(1);
}
