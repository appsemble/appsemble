import { Argv } from 'yargs';

import * as create from './create';
import * as deleteTeam from './delete';
import * as member from './member';
import * as update from './update';

export { noop as handler } from '@appsemble/utils';

export const command = 'team';
export const description = 'Commands related to app teams.';

export function builder(yargs: Argv): Argv {
  return yargs.command(create).command(deleteTeam).command(member).command(update).demandCommand(1);
}
