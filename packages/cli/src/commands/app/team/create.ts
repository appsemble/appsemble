import { Argv } from 'yargs';

import { authenticate } from '../../../lib/authentication';
import { createTeam } from '../../../lib/team';
import { BaseArguments } from '../../../types';

interface CreateTeamArguments extends BaseArguments {
  appId: number;
  name: string;
}

export const command = 'create <name>';
export const description = 'Create a new team for an app.';

export function builder(yargs: Argv): Argv {
  return yargs
    .positional('name', {
      describe: 'The name of the team.',
      demandOption: true,
    })
    .option('app-id', {
      describe: 'The ID of the app to create the team for.',
      type: 'number',
      demandOption: true,
    });
}

export async function handler({
  appId,
  clientCredentials,
  name,
  remote,
}: CreateTeamArguments): Promise<void> {
  await authenticate(remote, 'apps:write teams:write', clientCredentials);

  await createTeam({
    name,
    appId,
  });
}
