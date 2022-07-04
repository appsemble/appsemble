import { TeamMember } from '@appsemble/types';
import axios from 'axios';

import { ActionCreator } from '.';
import { apiUrl, appId } from '../settings';

export const teamJoin: ActionCreator<'team.join'> = ({ getUserInfo, updateTeam }) => [
  async (id: number) => {
    const userInfo = getUserInfo();
    if (!userInfo?.sub) {
      throw new Error('User is not logged in');
    }

    const { data: team } = await axios.post<TeamMember>(
      `${apiUrl}/api/apps/${appId}/teams/${id}/members`,
      {
        id: userInfo.sub,
      },
    );
    updateTeam(team);
    return team;
  },
];

export const teamList: ActionCreator<'team.list'> = ({ teams }) => [() => teams];

export const teamInvite: ActionCreator<'team.invite'> = ({ definition, remap }) => [
  async (data) => {
    const id = definition.id ? await remap(definition.id, data) : (data as any).id;
    const email = definition.email ? await remap(definition.email, data) : (data as any).email;

    await axios.post<unknown>(`${apiUrl}/api/apps/${appId}/teams/${id}/invite`, { email });
  },
];
