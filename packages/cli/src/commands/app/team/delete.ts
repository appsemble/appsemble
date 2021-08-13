import { Argv } from 'yargs';

import { authenticate } from '../../../lib/authentication';
import { deleteTeam } from '../../../lib/team';
import { BaseArguments } from '../../../types';

interface DeleteTeamArguments extends BaseArguments {
  appId: number;
  id: number;
}

export const command = 'delete';
export const description = 'Delete an existing team from an app.';

export function builder(yargs: Argv): Argv {
  return yargs
    .option('id', {
      describe: 'The ID of the team to delete.',
      demandOption: true,
    })
    .option('app-id', {
      describe: 'The ID of the app to delete the team from.',
      type: 'number',
      demandOption: true,
    });
}

export async function handler({
  appId,
  clientCredentials,
  id,
  remote,
}: DeleteTeamArguments): Promise<void> {
  await authenticate(remote, 'apps:write teams:write', clientCredentials);

  await deleteTeam({
    id,
    appId,
  });
}
