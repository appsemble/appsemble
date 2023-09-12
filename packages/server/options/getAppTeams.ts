import { type ExtendedTeam, type GetAppTeamsParams } from '@appsemble/node-utils';

import { AppMember, Team, TeamMember } from '../models/index.js';

export async function getAppTeams({ app, user }: GetAppTeamsParams): Promise<ExtendedTeam[]> {
  const teams = await Team.findAll({
    where: {
      AppId: app.id,
    },
    include: [{ model: TeamMember, include: [{ model: AppMember }], required: false }],
    order: [['name', 'ASC']],
  });

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    size: team.Members.length,
    role: team.Members.find((m) => m.AppMember.UserId === user.id)?.role,
    annotations: team.annotations ?? {},
  }));
}
