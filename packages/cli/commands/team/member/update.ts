import { TeamRole } from '@appsemble/utils';
import { Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../../lib/app.js';
import { authenticate } from '../../../lib/authentication.js';
import { updateMember } from '../../../lib/team.js';
import { BaseArguments } from '../../../types.js';

interface InviteTeamArguments extends BaseArguments {
  appId: number;
  id: number;
  user: string;
  role: TeamRole;
  context: string;
  app: string;
}

export const command = 'update <user> <role>';
export const description = 'Update an existing team member.';

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
    })
    .positional('role', {
      describe: 'The new role of the member.',
      demandOption: true,
      choices: Object.values(TeamRole),
    });
}

export async function handler({
  app,
  appId,
  clientCredentials,
  context,
  id,
  remote,
  role,
  user,
}: InviteTeamArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);

  await authenticate(resolvedRemote, 'teams:write', clientCredentials);
  await updateMember({
    id,
    appId: resolvedAppId,
    user,
    role,
    remote: resolvedRemote,
  });
}
