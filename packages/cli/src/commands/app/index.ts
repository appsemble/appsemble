import { Argv } from 'yargs';

import * as create from './create';
import * as extractMessages from './extract-messages';
import * as update from './update';

export { noop as handler } from '@appsemble/utils';

export const command = 'app';
export const description = 'Commands related to apps.';

export function builder(yargs: Argv): Argv {
  return yargs.command(create).command(extractMessages).command(update).demandCommand(1);
}
