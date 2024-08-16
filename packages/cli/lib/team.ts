import { AppsembleError, authenticate, logger } from '@appsemble/node-utils';
import { type Team } from '@appsemble/types';
import { type TeamRole } from '@appsemble/utils';
import axios from 'axios';

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
   * The client credentials used to authenticate
   */
  clientCredentials?: string;
}

interface SharedExistingTeamParams extends SharedTeamParams {
  /**
   * The ID of the team.
   */
  id: number;
}

interface SharedTeamMemberParams extends SharedExistingTeamParams {
  /**
   * The ID or email address of the team member.
   */
  user: string;
}

interface UpdateTeamMemberParams extends SharedTeamMemberParams {
  /**
   * The new role of the team member.
   */
  role: TeamRole;
}

interface UpdateTeamParams extends SharedExistingTeamParams {
  /**
   * The new name of the team.
   */
  name?: string;

  /**
   * The list of annotations to apply in key=value format.
   */
  annotations?: string[];
}

interface CreateTeamParams extends SharedTeamParams {
  /**
   * The name of the team.
   */
  name: string;

  /**
   * The list of annotations to apply in key=value format.
   */
  annotations?: string[];
}

export function resolveAnnotations(annotations: string[]): Record<string, string> {
  const annotationRegex = /^\w+=.+$/;

  if (annotations.some((a) => !annotationRegex.test(a))) {
    throw new AppsembleError('One of the annotations did not follow the pattern of key=value');
  }

  return annotations.length
    ? Object.fromEntries(
        annotations.map((annotation) => {
          const [key, ...value] = annotation.split('=');
          return [key, value.join('=')];
        }),
      )
    : undefined;
}

export async function createTeam({
  annotations = [],
  appId,
  clientCredentials,
  name,
  remote,
}: CreateTeamParams): Promise<void> {
  logger.info(`Creating team ${name}`);
  await authenticate(remote, 'teams:write', clientCredentials);
  try {
    const {
      data: { id },
    } = await axios.post<Team>(
      `/api/apps/${appId}/teams`,
      {
        name,
        annotations: resolveAnnotations(annotations),
      },
      { baseURL: remote },
    );
    logger.info(`Successfully created team ${name} with ID ${id}`);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function deleteTeam({
  appId,
  clientCredentials,
  id,
  remote,
}: SharedExistingTeamParams): Promise<void> {
  await authenticate(remote, 'teams:write', clientCredentials);
  logger.info(`Deleting team ${id}`);
  try {
    await axios.delete(`/api/apps/${appId}/teams/${id}`, { baseURL: remote });
    logger.info(`Successfully deleted team ${id}`);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function updateTeam({
  annotations = [],
  appId,
  id,
  name,
  remote,
}: UpdateTeamParams): Promise<void> {
  logger.info(`Updating team ${id}`);
  try {
    await axios.patch(
      `/api/apps/${appId}/teams/${id}`,
      {
        name,
        annotations: resolveAnnotations(annotations),
      },
      { baseURL: remote },
    );
    logger.info(`Successfully updated team ${id}`);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function inviteMember({
  appId,
  id,
  remote,
  user,
}: SharedTeamMemberParams): Promise<void> {
  logger.info(`Inviting ${user} to team ${id}`);
  try {
    await axios.post(`/api/apps/${appId}/teams/${id}/members`, { id: user }, { baseURL: remote });
    logger.info(`Successfully invited ${user} to team ${id}`);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function updateMember({
  appId,
  id,
  remote,
  role,
  user,
}: UpdateTeamMemberParams): Promise<void> {
  logger.info(`Updating ${user}’s role in team ${id} to ${role}`);
  try {
    await axios.put(
      `/api/apps/${appId}/teams/${id}/members/${user}`,
      { role },
      { baseURL: remote },
    );
    logger.info(`Successfully updated ${user} in team ${id}`);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function deleteMember({ appId, id, user }: SharedTeamMemberParams): Promise<void> {
  logger.info(`Deleting ${user} to team ${id}`);
  await axios.delete(`/api/apps/${appId}/teams/${id}/members/${user}`);
  logger.info(`Successfully deleted ${user} from team ${id}`);
}
