import { AppsembleError, authenticate, logger } from '@appsemble/node-utils';
import { type AppRole, type Group } from '@appsemble/types';
import axios from 'axios';

interface SharedGroupParams {
  /**
   * The ID of the app to create the group for.
   */
  appId: number;

  /**
   * The remote server to create the group on.
   */
  remote: string;

  /**
   * The client credentials used to authenticate
   */
  clientCredentials?: string;
}

interface SharedExistingGroupParams extends SharedGroupParams {
  /**
   * The ID of the group.
   */
  id: number;
}

interface SharedGroupMemberParams extends SharedExistingGroupParams {
  /**
   * The ID or email address of the group member.
   */
  user: string;
}

interface InviteGroupMemberParams extends SharedGroupMemberParams {
  /**
   * The role to invite the group member with.
   */
  role: AppRole;
}

interface UpdateGroupMemberParams extends SharedGroupMemberParams {
  /**
   * The new role of the group member.
   */
  role: AppRole;
}

interface UpdateGroupParams extends SharedExistingGroupParams {
  /**
   * The new name of the group.
   */
  name?: string;

  /**
   * The list of annotations to apply in key=value format.
   */
  annotations?: string[];
}

interface CreateGroupParams extends SharedGroupParams {
  /**
   * The name of the group.
   */
  name: string;

  /**
   * The list of annotations to apply in key=value format.
   */
  annotations?: string[];
}

export function resolveAnnotations(annotations: string[]): Record<string, string> | undefined {
  const annotationRegex = /^\w+=.+$/;

  if (!annotations.length) {
    return undefined;
  }

  if (annotations.some((a) => !annotationRegex.test(a))) {
    throw new AppsembleError('One of the annotations did not follow the pattern of key=value');
  }

  return Object.fromEntries(
    annotations.map((annotation) => {
      const [key, ...value] = annotation.split('=');
      return [key, value.join('=')];
    }),
  );
}

export async function createGroup({
  annotations = [],
  appId,
  clientCredentials,
  name,
  remote,
}: CreateGroupParams): Promise<void> {
  logger.info(`Creating group ${name}`);
  await authenticate(remote, 'groups:write', clientCredentials);
  const {
    data: { id },
  } = await axios.post<Group>(
    `/api/apps/${appId}/groups`,
    {
      name,
      annotations: resolveAnnotations(annotations),
    },
    { baseURL: remote },
  );
  logger.info(`Successfully created group ${name} with ID ${id}`);
}

export async function deleteGroup({
  appId,
  clientCredentials,
  id,
  remote,
}: SharedExistingGroupParams): Promise<void> {
  await authenticate(remote, 'groups:write', clientCredentials);
  logger.info(`Deleting group ${id}`);
  await axios.delete(`/api/apps/${appId}/groups/${id}`, { baseURL: remote });
  logger.info(`Successfully deleted group ${id}`);
}

export async function updateGroup({
  annotations = [],
  appId,
  id,
  name,
  remote,
}: UpdateGroupParams): Promise<void> {
  logger.info(`Updating group ${id}`);
  await axios.patch(
    `/api/apps/${appId}/groups/${id}`,
    {
      name,
      annotations: resolveAnnotations(annotations),
    },
    { baseURL: remote },
  );
  logger.info(`Successfully updated group ${id}`);
}

export async function inviteMember({
  appId,
  id,
  remote,
  role,
  user,
}: InviteGroupMemberParams): Promise<void> {
  logger.info(`Inviting ${user} to group ${id}`);
  await axios.post(`/api/apps/${appId}/groups/${id}/invites`, [{ email: user, role }], {
    baseURL: remote,
  });
  logger.info(`Successfully invited ${user} to group ${id}`);
}

export async function updateMember({
  appId,
  id,
  remote,
  role,
  user,
}: UpdateGroupMemberParams): Promise<void> {
  logger.info(`Updating ${user}’s role in group ${id} to ${role}`);
  await axios.put(`/api/apps/${appId}/group-members/${user}/role`, { role }, { baseURL: remote });
  logger.info(`Successfully updated ${user} in group ${id}`);
}

export async function deleteMember({ appId, id, user }: SharedGroupMemberParams): Promise<void> {
  logger.info(`Deleting ${user} to group ${id}`);
  await axios.delete(`/api/apps/${appId}/group-members/${user}?selectedGroupId=${id}`);
  logger.info(`Successfully deleted ${user} from group ${id}`);
}
