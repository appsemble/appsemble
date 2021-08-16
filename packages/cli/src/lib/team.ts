import { logger } from '@appsemble/node-utils';
import { TeamRole } from '@appsemble/utils';
import axios from 'axios';

interface SharedTeamParams {
  /**
   * The ID of the app to create the team for.
   */
  appId: number;
}

interface SharedExistingTeamParams extends SharedTeamParams {
  /**
   * The ID of the team.
   */
  id: number;
}

interface SharedTeamMemberParams extends SharedExistingTeamParams {
  /**
   * The ID or email adress of the team member.
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
}

export async function createTeam({ appId, name }: CreateTeamParams): Promise<void> {
  logger.info(`Creating team ${name}`);
  const {
    data: { id },
  } = await axios.post(`/api/apps/${appId}/teams`, {
    name,
  });
  logger.info(`Successfully created team ${name} with ID ${id}`);
}

export async function deleteTeam({ appId, id }: SharedExistingTeamParams): Promise<void> {
  logger.info(`Deleting team ${id}`);
  await axios.delete(`/api/apps/${appId}/teams/${id}`);
  logger.info(`Successfully deleted team ${id}`);
}

export async function updateTeam({
  appId,
  id,
  name,
  annotations = [],
}: UpdateTeamParams): Promise<void> {
  logger.info(`Updating team ${id}`);
  await axios.put(`/api/apps/${appId}/teams/${id}`, {
    name,
    annotations: annotations.length
      ? Object.fromEntries(
          annotations.map((annotation) => {
            const [key, ...value] = annotation.split('=');
            return [key, value.join('=')];
          }),
        )
      : undefined,
  });
  logger.info(`Successfully updated team ${id}`);
}

export async function inviteMember({ appId, id, user }: SharedTeamMemberParams): Promise<void> {
  logger.info(`Inviting ${user} to team ${id}`);
  await axios.post(`/api/apps/${appId}/teams/${id}/members`, { id: user });
  logger.info(`Successfully invited ${user} to team ${id}`);
}

export async function updateMember({
  appId,
  id,
  role,
  user,
}: UpdateTeamMemberParams): Promise<void> {
  logger.info(`Updating ${user}’s role in team ${id} to ${role}`);
  await axios.put(`/api/apps/${appId}/teams/${id}/members/${user}`, { role });
  logger.info(`Successfully updated ${user} in team ${id}`);
}

export async function deleteMember({ appId, id, user }: SharedTeamMemberParams): Promise<void> {
  logger.info(`Deleting ${user} to team ${id}`);
  await axios.delete(`/api/apps/${appId}/teams/${id}/members/${user}`);
  logger.info(`Successfully deleted ${user} from team ${id}`);
}
