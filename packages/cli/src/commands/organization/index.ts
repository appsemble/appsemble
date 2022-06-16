import { Argv } from 'yargs';

import * as create from './create';
import * as update from './update';

export { noop as handler } from '@appsemble/utils';

export const command = 'organization';
export const description = 'Commands related to organizations.';

export function builder(yargs: Argv): Argv {
  return yargs.command(create).command(update).demandCommand(1);
}
