import { type Argv, type CommandModule } from 'yargs';

import * as create from './create.js';

export { noop as handler } from '@appsemble/utils';

export const command = 'asset';
export const description = 'Commands related to app assets.';

export function builder(yargs: Argv): Argv {
  return yargs.command(create as unknown as CommandModule).demandCommand(1);
}
