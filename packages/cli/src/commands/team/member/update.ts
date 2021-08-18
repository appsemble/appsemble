import { TeamRole } from '@appsemble/utils';
import { Argv } from 'yargs';

import { authenticate } from '../../../lib/authentication';
import { updateMember } from '../../../lib/team';
import { BaseArguments } from '../../../types';

interface InviteTeamArguments extends BaseArguments {
  appId: number;
  id: number;
  user: string;
  role: TeamRole;
}

export const command = 'update <user> <role>';
export const description = 'Update an existing team member.';

export function builder(yargs: Argv): Argv {
  return yargs
    .option('id', {
      describe: 'The ID of the team.',
      demandOption: true,
    })
    .option('app-id', {
      describe: 'The ID of the app of the team',
      type: 'number',
      demandOption: true,
    })
    .positional('user', {
      describe: 'The ID or email address of the user you want to invite.',
      demandOption: true,
    })
    .positional('role', {
      describe: 'The new role of the member.',
      demandOption: true,
      choices: Object.values(TeamRole),
    });
}

export async function handler({
  appId,
  clientCredentials,
  id,
  remote,
  role,
  user,
}: InviteTeamArguments): Promise<void> {
  await authenticate(remote, 'teams:write', clientCredentials);

  await updateMember({
    id,
    appId,
    user,
    role,
  });
}
