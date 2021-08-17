import { Argv } from 'yargs';

import { authenticate } from '../../../lib/authentication';
import { inviteMember } from '../../../lib/team';
import { BaseArguments } from '../../../types';

interface InviteTeamArguments extends BaseArguments {
  appId: number;
  id: number;
  user: string;
}

export const command = 'invite <user>';
export const description = 'Invite a new member to an existing team from an app.';

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
    });
}

export async function handler({
  appId,
  clientCredentials,
  id,
  remote,
  user,
}: InviteTeamArguments): Promise<void> {
  await authenticate(remote, 'teams:write', clientCredentials);

  await inviteMember({
    id,
    appId,
    user,
  });
}
