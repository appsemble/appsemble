import { authenticate, logger } from '@appsemble/node-utils';
import axios from 'axios';
import { type Argv } from 'yargs';

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
  await authenticate(remote, 'apps:delete', clientCredentials);
  const response = await axios.get(`/api/apps/${id}`);
  const { name } = response.data;
  logger.warn(`Deleting app: ${name}`);

  axios.delete(`/api/apps/${id}`, {
    baseURL: remote,
  });
  logger.info(`Successfully deleted ${name} app.`);
}
