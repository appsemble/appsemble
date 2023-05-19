import { type TeamMember } from '@appsemble/types';
import axios from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';

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

export const teamMembers: ActionCreator<'team.members'> = ({
  definition,
  getUserInfo,
  remap,
  teams,
}) => [
  async (data) => {
    const teamId = definition.id ? remap(definition.id, data) : null;
    const userInfo = getUserInfo();
    if (!userInfo) {
      throw new Error('User is not logged in');
    }

    let teamMemberList: TeamMember[] = [];

    if (teamId) {
      teamMemberList = await axios
        .get<TeamMember[]>(`${apiUrl}/api/apps/${appId}/teams/${teamId}/members`)
        .then((response) => response.data);

      if (!teamMemberList.some((member) => String(member.id) === userInfo.sub)) {
        throw new Error('User is not a member of the specified team');
      }
    } else {
      let userFirstTeam: TeamMember;
      for (const team of teams) {
        userFirstTeam = await axios
          .get(`${apiUrl}/api/apps/${appId}/teams/${team.id}/members/${userInfo.sub}`)
          .then((response) => response.data)
          .catch(() => null);
      }

      teamMemberList = await axios
        .get<TeamMember[]>(`${apiUrl}/api/apps/${appId}/teams/${userFirstTeam.id}/members`)
        .then((response) => response.data);
    }

    return teamMemberList;
  },
];
