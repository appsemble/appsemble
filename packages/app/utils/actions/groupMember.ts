import { type GroupInvite, type GroupMember } from '@appsemble/types';
import axios from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';

export const groupMemberInvite: ActionCreator<'group.member.invite'> = ({
  definition,
  getAppMemberInfo,
  getAppMemberSelectedGroup,
  remap,
}) => [
  async (data) => {
    const appMemberInfo = getAppMemberInfo();

    if (!appMemberInfo?.sub) {
      // App member is not logged in, do nothing.
      return data;
    }

    const id = remap(definition.id, data);
    const email = remap(definition.email, data);
    const role = remap(definition.role, data);

    const { data: response } = await axios.post<GroupInvite[]>(
      `${apiUrl}/api/apps/${appId}/groups/${id}/invites?selectedGroupId=${getAppMemberSelectedGroup()?.id}`,
      { email, role },
    );

    return response;
  },
];

export const groupMemberQuery: ActionCreator<'group.member.query'> = ({
  definition,
  getAppMemberInfo,
  getAppMemberSelectedGroup,
  remap,
}) => [
  async (data) => {
    const appMemberInfo = getAppMemberInfo();

    if (!appMemberInfo?.sub) {
      // App member is not logged in, do nothing.
      return data;
    }

    const id = remap(definition.id, data);

    const { data: response } = await axios.get<GroupMember[]>(
      `${apiUrl}/api/apps/${appId}/groups/${id}/members?selectedGroupId=${getAppMemberSelectedGroup()?.id}`,
    );

    return response;
  },
];

export const groupMemberDelete: ActionCreator<'group.member.delete'> = ({
  definition,
  getAppMemberInfo,
  getAppMemberSelectedGroup,
  remap,
}) => [
  async (data) => {
    const appMemberInfo = getAppMemberInfo();

    if (!appMemberInfo?.sub) {
      // App member is not logged in, do nothing.
      return data;
    }

    const id = remap(definition.id, data);

    await axios.delete(
      `${apiUrl}/api/apps/${appId}/group-members/${id}?selectedGroupId=${getAppMemberSelectedGroup()?.id}`,
    );
  },
];

export const groupMemberRoleUpdate: ActionCreator<'group.member.role.update'> = ({
  definition,
  getAppMemberInfo,
  getAppMemberSelectedGroup,
  remap,
}) => [
  async (data) => {
    const appMemberInfo = getAppMemberInfo();

    if (!appMemberInfo?.sub) {
      // App member is not logged in, do nothing.
      return data;
    }

    const id = remap(definition.id, data);
    const role = remap(definition.role, data);

    const { data: response } = await axios.put<GroupMember>(
      `${apiUrl}/api/apps/${appId}/group-members/${id}/role?selectedGroupId=${getAppMemberSelectedGroup()?.id}`,
      {
        role,
      },
    );

    return response;
  },
];
