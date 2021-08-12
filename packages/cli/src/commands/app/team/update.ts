import { AppsembleError } from 'node-utils/src/AppsembleError';
import { Argv } from 'yargs';

import { updateTeam } from '../../../lib/team';
import { BaseArguments } from '../../../types';

interface UpdateTeamArguments extends BaseArguments {
  appId: number;
  id: number;
  name: string;
  annotation: string[];
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
  appId,
  clientCredentials,
  id,
  name,
  remote,
}: UpdateTeamArguments): Promise<void> {
  if (annotation.some((a) => !annotationRegex.test(a))) {
    throw new AppsembleError('One of the annotations did not follow the pattern of key=value');
  }

  await updateTeam({
    clientCredentials,
    remote,
    id,
    appId,
    name,
    annotations: annotation,
  });
}
