import { Argv } from 'yargs';

import { authenticate } from '../../../../lib/authentication';
import { deleteMember } from '../../../../lib/team';
import { BaseArguments } from '../../../../types';

interface DeleteTeamArguments extends BaseArguments {
  appId: number;
  id: number;
  user: string;
}

export const command = 'delete <user>';
export const description = 'Delete a new member to an existing team from an app.';

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
      describe: 'The ID or email address of the user you want to delete.',
      demandOption: true,
    });
}

export async function handler({
  appId,
  clientCredentials,
  id,
  remote,
  user,
}: DeleteTeamArguments): Promise<void> {
  await authenticate(remote, 'apps:write teams:write', clientCredentials);

  await deleteMember({
    id,
    appId,
    user,
  });
}
