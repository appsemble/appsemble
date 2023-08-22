import { type Argv, type CommandModule } from 'yargs';

import * as build from './build.js';
import * as remove from './delete.js';
import * as extractMessages from './extract-messages.js';
import * as publish from './publish.js';

export { noop as handler } from '@appsemble/utils';

export const command = 'block';
export const description = 'Commands related to blocks.';

export function builder(yargs: Argv): Argv {
  return yargs
    .command(build as unknown as CommandModule)
    .command(extractMessages as unknown as CommandModule)
    .command(publish as unknown as CommandModule)
    .command(remove as unknown as CommandModule)
    .demandCommand(1);
}
