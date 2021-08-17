import { join } from 'path';

import { AppsembleError, readData } from '@appsemble/node-utils';
import { Argv } from 'yargs';

import { authenticate } from '../../../lib/authentication';
import { inviteMember } from '../../../lib/team';
import { AppsembleRC, BaseArguments } from '../../../types';

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
      conflicts: 'app',
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
  let resolvedAppId: number;
  let resolvedRemote = remote;

  if (app) {
    const [rc] = await readData<AppsembleRC>(join(app, '.appsemblerc.yaml'));
    if (rc.context?.[context]?.id) {
      resolvedAppId = Number(rc?.context?.[context]?.id);
    } else {
      throw new AppsembleError(
        `App ID was not found in ${join(app, '.appsemblerc.yaml')} context.${context}.id`,
      );
    }

    if (rc.context?.[context]?.remote) {
      resolvedRemote = rc.context?.[context]?.remote;
    }
  } else {
    resolvedAppId = appId;
  }

  await authenticate(resolvedRemote, 'teams:write', clientCredentials);
  await inviteMember({
    id,
    appId: resolvedAppId,
    user,
  });
}
