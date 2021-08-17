import { join } from 'path';

import { AppsembleError, readData } from '@appsemble/node-utils';
import { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { deleteTeam } from '../../lib/team';
import { AppsembleRC, BaseArguments } from '../../types';

interface DeleteTeamArguments extends BaseArguments {
  appId: number;
  id: number;
  context: string;
  app: string;
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
      conflicts: 'app',
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
  await deleteTeam({
    id,
    appId: resolvedAppId,
  });
}
