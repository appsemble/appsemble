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

    const {
      data: { role },
    } = await axios.post<TeamMember>(`${apiUrl}/api/apps/${appId}/teams/${id}/members`, {
      id: userInfo.sub,
    });
    const team = { role, id };
    updateTeam(team);
    return team;
  },
];

export const teamList: ActionCreator<'team.list'> = ({ teams }) => [() => teams];
