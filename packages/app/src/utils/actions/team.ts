import { BaseAction } from '@appsemble/sdk';
import { BaseActionDefinition, TeamMember } from '@appsemble/types';
import axios from 'axios';

import { MakeActionParameters } from '../../types';
import { apiUrl, appId } from '../settings';

export function teamJoin({
  updateTeam,
  userInfo,
}: MakeActionParameters<BaseActionDefinition<'team.join'>>): BaseAction<'team.join'> {
  return {
    type: 'team.join',
    async dispatch(id) {
      const {
        data: { role },
      } = await axios.post<TeamMember>(`${apiUrl}/api/apps/${appId}/teams/${id}/members`, {
        id: userInfo.sub,
      });
      const team = { role, id };
      updateTeam(team);
      return team;
    },
  };
}

export function teamList({
  teams,
}: MakeActionParameters<BaseActionDefinition<'team.list'>>): BaseAction<'team.list'> {
  return {
    type: 'team.list',
    dispatch: () => Promise.resolve(teams),
  };
}
