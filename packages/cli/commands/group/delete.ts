import { type Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../lib/app.js';
import { deleteGroup } from '../../lib/group.js';
import { type BaseArguments } from '../../types.js';

interface DeleteGroupArguments extends BaseArguments {
  appId: number;
  id: number;
  context: string;
  app: string;
}

export const command = 'delete';
export const description = 'Delete an existing group from an app.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .option('id', {
      describe: 'The ID of the group to delete.',
      demandOption: true,
    })
    .option('app-id', {
      describe: 'The ID of the app to delete the group from.',
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
}: DeleteGroupArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);

  await deleteGroup({
    id,
    appId: resolvedAppId,
    remote: resolvedRemote,
    clientCredentials,
  });
}
