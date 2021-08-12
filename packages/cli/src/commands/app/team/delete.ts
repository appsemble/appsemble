import { Argv } from 'yargs';

import { deleteTeam } from '../../../lib/team';
import { BaseArguments } from '../../../types';

interface CreateTeamArguments extends BaseArguments {
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
}: CreateTeamArguments): Promise<void> {
  await deleteTeam({
    clientCredentials,
    remote,
    id,
    appId,
  });
}
