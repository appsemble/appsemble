import { authenticate } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../lib/app.js';
import { updateTeam } from '../../lib/team.js';
import { type BaseArguments } from '../../types.js';

interface UpdateTeamArguments extends BaseArguments {
  appId: number;
  id: number;
  name: string;
  annotation: string[];
  context: string;
  app: string;
}

export const command = 'update';
export const description = 'Update an existing team for an app.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .option('id', {
      describe: 'The ID of the team to update.',
      demandOption: true,
    })
    .option('name', {
      describe: 'The new name of the team.',
    })
    .option('annotation', {
      type: 'array',
      describe: 'The new list of annotations. The format is key=value.',
    })
    .option('app-id', {
      describe: 'The ID of the app to delete the team from.',
      type: 'number',
      demandOption: true,
    });
}

export async function handler({
  annotation,
  app,
  appId,
  clientCredentials,
  context,
  id,
  name,
  remote,
}: UpdateTeamArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);

  await authenticate(resolvedRemote, 'teams:write', clientCredentials);
  await updateTeam({
    id,
    appId: resolvedAppId,
    name,
    annotations: annotation,
    remote: resolvedRemote,
  });
}
