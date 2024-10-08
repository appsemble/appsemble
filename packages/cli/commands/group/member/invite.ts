import { authenticate } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../../lib/app.js';
import { inviteMember } from '../../../lib/group.js';
import { type BaseArguments } from '../../../types.js';

interface InviteGroupArguments extends BaseArguments {
  appId: number;
  id: number;
  user: string;
  context: string;
  app: string;
}

export const command = 'invite <user>';
export const description = 'Invite a new member to an existing group from an app.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .option('id', {
      describe: 'The ID of the group.',
      demandOption: true,
    })
    .option('app-id', {
      describe: 'The ID of the app of the group',
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
}: InviteGroupArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);

  await authenticate(resolvedRemote, 'groups:write', clientCredentials);
  await inviteMember({
    id,
    appId: resolvedAppId,
    user,
    remote: resolvedRemote,
  });
}
