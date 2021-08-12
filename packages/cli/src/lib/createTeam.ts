import axios from 'axios';

import { authenticate } from './authentication';

interface CreateTeamParams {
  /**
   * The ID of the app to create the team for.
   */
  appId: number;

  /**
   * The name of the team.
   */
  name: string;

  /**
   * The remote server to create the team on.
   */
  remote: string;
  /**
   * The OAuth2 client credentials to use.
   */
  clientCredentials: string;
}

export async function createTeam({
  appId,
  clientCredentials,
  name,
  remote,
}: CreateTeamParams): Promise<void> {
  await authenticate(remote, 'apps:write teams:write', clientCredentials);
  await axios.post(`/api/apps/${appId}/teams`, {
    name,
  });
}
