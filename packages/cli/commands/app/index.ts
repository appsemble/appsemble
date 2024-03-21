import { type Argv, type CommandModule } from 'yargs';

import * as create from './create.js';
import * as remove from './delete.js';
import * as exportApp from './export.js';
import * as extractMessages from './extract-messages.js';
import * as importApp from './import.js';
import * as patch from './patch.js';
import * as publish from './publish.js';
import * as update from './update.js';

export { noop as handler } from '@appsemble/utils';

export const command = 'app';
export const description = 'Commands related to apps.';

export function builder(yargs: Argv): Argv {
  return yargs
    .command(publish as unknown as CommandModule)
    .command(create as unknown as CommandModule)
    .command(remove as unknown as CommandModule)
    .command(exportApp as unknown as CommandModule)
    .command(extractMessages as unknown as CommandModule)
    .command(importApp as unknown as CommandModule)
    .command(patch as unknown as CommandModule)
    .command(update as unknown as CommandModule)
    .demandCommand(1);
}
