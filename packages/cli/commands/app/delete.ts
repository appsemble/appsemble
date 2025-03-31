import { type Argv } from 'yargs';

import { deleteApp } from '../../lib/app.js';
import { type BaseArguments } from '../../types.js';

interface DeleteAppArguments extends BaseArguments {
  id: number;
}

export const command = 'delete';
export const description = 'Delete an app using the app id.';

export function builder(yargs: Argv): Argv<any> {
  return yargs.option('id', {
    describe: 'id of the app to be deleted.',
    demandOption: true,
  });
}

export async function handler({
  clientCredentials,
  id,
  remote,
}: DeleteAppArguments): Promise<void> {
  await deleteApp({ id, remote, clientCredentials: clientCredentials ?? '' });
}
