import { AppsembleError } from '@appsemble/node-utils';
import { Argv } from 'yargs';

import { resolveAppIdAndRemote } from '../../lib/app';
import { authenticate } from '../../lib/authentication';
import { updateTeam } from '../../lib/team';
import { BaseArguments } from '../../types';

interface UpdateTeamArguments extends BaseArguments {
  appId: number;
  id: number;
  name: string;
  annotation: string[];
  context: string;
  app: string;
}

export const command = 'update';
export const description = 'Update an existing team for an app.';

export function builder(yargs: Argv): Argv {
  return yargs
    .option('id', {
      describe: 'The ID of the team to update.',
      demandOption: true,
    })
    .option('name', {
      describe: 'The new name of the team.',
    })
    .option('annotation', {
      type: 'array',
      describe: 'The new list of annotations. The format is key=value.',
    })
    .option('app-id', {
      describe: 'The ID of the app to delete the team from.',
      type: 'number',
      demandOption: true,
    });
}

const annotationRegex = /^\w+=.+$/;

export async function handler({
  annotation,
  app,
  appId,
  clientCredentials,
  context,
  id,
  name,
  remote,
}: UpdateTeamArguments): Promise<void> {
  if (annotation.some((a) => !annotationRegex.test(a))) {
    throw new AppsembleError('One of the annotations did not follow the pattern of key=value');
  }

  const [resolvedAppId, resolvedRemote] = await resolveAppIdAndRemote(
    app,
    context,
    remote,
    String(appId),
  );

  await authenticate(resolvedRemote, 'teams:write', clientCredentials);
  await updateTeam({
    id,
    appId: resolvedAppId,
    name,
    annotations: annotation,
  });
}
