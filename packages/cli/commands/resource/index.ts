import { type Argv, type CommandModule } from 'yargs';

import * as publish from './publish.js';
import * as update from './update.js';

export { noop as handler } from '@appsemble/utils';

export const command = 'resource';
export const description = 'Commands related to resources.';

export function builder(yargs: Argv): Argv {
  return yargs
    .command(publish as unknown as CommandModule)
    .command(update as unknown as CommandModule)
    .demandCommand(1);
}
