import { type GroupMember } from '@appsemble/types';
import axios from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';

export const groupJoin: ActionCreator<'group.join'> = ({ getAppMemberInfo, updateGroup }) => [
  async (id: number) => {
    const appMemberInfo = getAppMemberInfo();
    if (!appMemberInfo?.sub) {
      throw new Error('App member is not logged in');
    }

    const { data: group } = await axios.post<GroupMember>(
      `${apiUrl}/api/apps/${appId}/groups/${id}/members`,
      {
        id: appMemberInfo.sub,
      },
    );
    updateGroup(group);
    return group;
  },
];

export const groupList: ActionCreator<'group.list'> = ({ groups }) => [() => groups];

export const groupInvite: ActionCreator<'group.invite'> = ({ definition, remap }) => [
  async (data) => {
    const id = definition.id ? await remap(definition.id, data) : (data as any).id;
    const email = definition.email ? await remap(definition.email, data) : (data as any).email;

    await axios.post<unknown>(`${apiUrl}/api/apps/${appId}/groups/${id}/invite`, { email });
  },
];

export const groupMembers: ActionCreator<'group.members'> = ({
  definition,
  getAppMemberInfo,
  remap,
}) => [
  async (data) => {
    const groupId = definition.id ? remap(definition.id, data) : null;
    const appMemberInfo = getAppMemberInfo();

    if (!appMemberInfo) {
      throw new Error('User is not logged in');
    }

    if (!groupId) {
      throw new Error('Group id is not valid');
    }

    try {
      await axios.get(`${apiUrl}/api/apps/${appId}/groups/${groupId}/members/${appMemberInfo.sub}`);
    } catch {
      throw new Error('User is not a member of the specified group');
    }

    const groupMemberList = await axios
      .get<GroupMember[]>(`${apiUrl}/api/apps/${appId}/groups/${groupId}/members`)
      .then((response) => response.data);

    return groupMemberList;
  },
];
