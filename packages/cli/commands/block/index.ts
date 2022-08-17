import { Argv } from 'yargs';

import * as build from './build.js';
import * as extractMessages from './extract-messages.js';
import * as publish from './publish.js';

export { noop as handler } from '@appsemble/utils';

export const command = 'block';
export const description = 'Commands related to blocks.';

export function builder(yargs: Argv): Argv {
  return yargs.command(build).command(extractMessages).command(publish).demandCommand(1);
}
