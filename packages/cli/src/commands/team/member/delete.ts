import { Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../../lib/app';
import { authenticate } from '../../../lib/authentication';
import { deleteMember } from '../../../lib/team';
import { BaseArguments } from '../../../types';

interface DeleteTeamArguments extends BaseArguments {
  appId: number;
  id: number;
  user: string;
  context: string;
  app: string;
}

export const command = 'delete <user>';
export const description = 'Delete a new member to an existing team from an app.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .option('id', {
      describe: 'The ID of the team.',
      demandOption: true,
    })
    .option('app-id', {
      describe: 'The ID of the app of the team',
      type: 'number',
    })
    .positional('user', {
      describe: 'The ID or email address of the user you want to delete.',
      demandOption: true,
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
  user,
}: DeleteTeamArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);

  await authenticate(resolvedRemote, 'teams:write', clientCredentials);
  await deleteMember({
    id,
    appId: resolvedAppId,
    user,
    remote: resolvedRemote,
  });
}
