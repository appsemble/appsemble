import { type Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../lib/app.js';
import { authenticate } from '../../lib/authentication.js';
import { createTeam } from '../../lib/team.js';
import { type BaseArguments } from '../../types.js';

interface CreateTeamArguments extends BaseArguments {
  appId: number;
  name: string;
  context: string;
  app: string;
  annotation: string[];
}

export const command = 'create <name>';
export const description = 'Create a new team for an app.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('name', {
      describe: 'The name of the team.',
      demandOption: true,
    })
    .option('annotation', {
      type: 'array',
      describe: 'The new list of annotations. The format is key=value.',
    })
    .option('app-id', {
      describe: 'The ID of the app to create the team for.',
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
  annotation,
  app,
  appId,
  clientCredentials,
  context,
  name,
  remote,
}: CreateTeamArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);
  await authenticate(resolvedRemote, 'teams:write', clientCredentials);
  await createTeam({
    name,
    appId: resolvedAppId,
    annotations: annotation,
    remote: resolvedRemote,
  });
}
