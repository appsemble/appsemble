import { join } from 'path';

import { AppsembleError, readData } from '@appsemble/node-utils';
import { Argv } from 'yargs';

import { authenticate } from '../../lib/authentication';
import { createTeam } from '../../lib/team';
import { AppsembleRC, BaseArguments } from '../../types';

interface CreateTeamArguments extends BaseArguments {
  appId: number;
  name: string;
  context: string;
  app: string;
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
  name,
  remote,
}: CreateTeamArguments): Promise<void> {
  let id: number;
  let resolvedRemote = remote;

  if (app) {
    const [rc] = await readData<AppsembleRC>(join(app, '.appsemblerc.yaml'));
    if (rc.context?.[context]?.id) {
      id = Number(rc?.context?.[context]?.id);
    } else {
      throw new AppsembleError(
        `App ID was not found in ${join(app, '.appsemblerc.yaml')} context.${context}.id`,
      );
    }

    if (rc.context?.[context]?.remote) {
      resolvedRemote = rc.context?.[context]?.remote;
    }
  } else {
    id = appId;
  }

  await authenticate(resolvedRemote, 'teams:write', clientCredentials);
  await createTeam({
    name,
    appId: id,
  });
}
