import { Argv } from 'yargs';

import * as create from './create';

export { noop as handler } from '@appsemble/utils';

export const command = 'asset';
export const description = 'Commands related to app assets.';

export function builder(yargs: Argv): Argv {
  return yargs.command(create).demandCommand(1);
}
