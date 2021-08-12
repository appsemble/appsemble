import { logger } from '@appsemble/node-utils';
import axios from 'axios';

import { authenticate } from './authentication';

interface SharedTeamParams {
  /**
   * The ID of the app to create the team for.
   */
  appId: number;

  /**
   * The remote server to create the team on.
   */
  remote: string;

  /**
   * The OAuth2 client credentials to use.
   */
  clientCredentials: string;
}

interface SharedExistingTeamParams extends SharedTeamParams {
  /**
   * The ID of the team.
   */
  id: number;
}

interface CreateTeamParams extends SharedTeamParams {
  /**
   * The name of the team.
   */
  name: string;
}

export async function createTeam({
  appId,
  clientCredentials,
  name,
  remote,
}: CreateTeamParams): Promise<void> {
  await authenticate(remote, 'apps:write teams:write', clientCredentials);
  logger.info(`Creating team ${name}`);
  const {
    data: { id },
  } = await axios.post(`/api/apps/${appId}/teams`, {
    name,
  });
  logger.info(`Successfully created team ${name} with ID ${id}`);
}

export async function deleteTeam({
  appId,
  clientCredentials,
  id,
  remote,
}: SharedExistingTeamParams): Promise<void> {
  await authenticate(remote, 'apps:write teams:write', clientCredentials);
  logger.info(`Deleting team ${id}`);
  await axios.delete(`/api/apps/${appId}/teams/${id}`);
  logger.info(`Successfully deleted team ${id}`);
}
