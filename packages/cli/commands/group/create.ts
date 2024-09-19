import { type Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../lib/app.js';
import { createGroup } from '../../lib/group.js';
import { type BaseArguments } from '../../types.js';

interface CreateGroupArguments extends BaseArguments {
  appId: number;
  name: string;
  context: string;
  app: string;
  annotation: string[];
}

export const command = 'create <name>';
export const description = 'Create a new group for an app.';

export function builder(yargs: Argv): Argv<any> {
  return yargs
    .positional('name', {
      describe: 'The name of the group.',
      demandOption: true,
    })
    .option('annotation', {
      type: 'array',
      describe: 'The new list of annotations. The format is key=value.',
    })
    .option('app-id', {
      describe: 'The ID of the app to create the group for.',
      type: 'number',
    })
    .option('app', {
      describe: 'The path to the app.',
      implies: 'context',
    })
    .option('context', {
      describe: 'If specified, use the specified context from .appsemblerc.yaml',
      implies: 'app',
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
}: CreateGroupArguments): Promise<void> {
  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(app, context, remote, appId);
  await createGroup({
    name,
    appId: resolvedAppId,
    annotations: annotation,
    remote: resolvedRemote,
    clientCredentials,
  });
}
