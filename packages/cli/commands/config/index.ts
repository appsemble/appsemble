import { Argv } from 'yargs';

import * as get from './get';
import * as set from './set';

export { noop as handler } from '@appsemble/utils';

export const command = 'config';
export const description = 'Commands related to local configurations.';

export function builder(yargs: Argv): Argv {
  return yargs.command(get).command(set).demandCommand(1);
}
