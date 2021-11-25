import { Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../../lib/app';
import { authenticate } from '../../../lib/authentication';
import { inviteMember } from '../../../lib/team';
import { BaseArguments } from '../../../types';

interface InviteTeamArguments extends BaseArguments {
  appId: number;
  id: number;
  user: string;
  context: string;
  app: string;
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
    })
    .option('app', {
      describe: 'The path to the app.',
      demandOption: 'context',
    })
    .option('context', {
      describe: 'If specified, use the specified context from .appsemblerc.yaml',
      demandOption: 'app',
    })
    .positional('user', {
      describe: 'The ID or email address of the user you want to invite.',
      demandOption: true,
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
}: InviteTeamArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);

  await authenticate(resolvedRemote, 'teams:write', clientCredentials);
  await inviteMember({
    id,
    appId: resolvedAppId,
    user,
    remote: resolvedRemote,
  });
}
