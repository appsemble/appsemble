import { Argv } from 'yargs';

import * as deleteMember from './delete.js';
import * as invite from './invite.js';
import * as update from './update.js';

export { noop as handler } from '@appsemble/utils';

export const command = 'member';
export const description = 'Commands related to app team members.';

export function builder(yargs: Argv): Argv {
  return yargs.command(deleteMember).command(invite).command(update).demandCommand(1);
}
