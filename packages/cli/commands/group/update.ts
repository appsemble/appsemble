import { authenticate } from '@appsemble/node-utils';
import { type Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../lib/app.js';
import { updateGroup } from '../../lib/group.js';
import { type BaseArguments } from '../../types.js';

interface UpdateGroupArguments extends BaseArguments {
  appId: number;
  id: number;
  name: string;
  annotation: string[];
  context: string;
  app: string;
}

export const command = 'update';
export const description = 'Update an existing group for an app.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .option('id', {
      describe: 'The ID of the group to update.',
      demandOption: true,
    })
    .option('name', {
      describe: 'The new name of the group.',
    })
    .option('annotation', {
      type: 'array',
      describe: 'The new list of annotations. The format is key=value.',
    })
    .option('app', {
      describe: 'The path to the app.',
      implies: 'context',
    })
    .option('context', {
      describe:
        'If specified, use the specified context from .appsemblerc.yaml to resolve appId and remote',
      implies: 'app',
    })
    .option('app-id', {
      describe: 'The ID of the app to delete the group from.',
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
}: UpdateGroupArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);

  await authenticate(resolvedRemote, 'groups:write', clientCredentials);
  await updateGroup({
    id,
    appId: resolvedAppId,
    name,
    annotations: annotation,
    remote: resolvedRemote,
  });
}
