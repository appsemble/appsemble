import { Argv } from 'yargs';

import * as create from './create.js';
import * as deleteTeam from './delete.js';
import * as member from './member/index.js';
import * as update from './update.js';

export { noop as handler } from '@appsemble/utils';

export const command = 'team';
export const description = 'Commands related to app teams.';

export function builder(yargs: Argv): Argv {
  return yargs.command(create).command(deleteTeam).command(member).command(update).demandCommand(1);
}
