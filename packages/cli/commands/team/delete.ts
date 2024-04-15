import { type Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../lib/app.js';
import { deleteTeam } from '../../lib/team.js';
import { type BaseArguments } from '../../types.js';

interface DeleteTeamArguments extends BaseArguments {
  appId: number;
  id: number;
  context: string;
  app: string;
}

export const command = 'delete';
export const description = 'Delete an existing team from an app.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .option('id', {
      describe: 'The ID of the team to delete.',
      demandOption: true,
    })
    .option('app-id', {
      describe: 'The ID of the app to delete the team from.',
      type: 'number',
    })
    .option('app', {
      describe: 'The path to the app.',
      demandOption: 'context',
    })
    .option('context', {
      describe: 'If specified, use the specified context from .appsemblerc.yaml',
      demandOption: 'app',
    });
}

export async function handler({
  app,
  appId,
  clientCredentials,
  context,
  id,
  remote,
}: DeleteTeamArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);

  await deleteTeam({
    id,
    appId: resolvedAppId,
    remote: resolvedRemote,
    clientCredentials,
  });
}
