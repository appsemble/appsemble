import { type ExtendedTeam, type GetAppTeamsParams } from '@appsemble/node-utils';

import { Team, User } from '../models/index.js';

export async function getAppTeams({ app, user }: GetAppTeamsParams): Promise<ExtendedTeam[]> {
  const teams = await Team.findAll({
    where: {
      AppId: app.id,
    },
    include: [{ model: User, required: false }],
    order: [['name', 'ASC']],
  });

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    size: team.Users.length,
    role: team.Users.find((u) => u.id === user.id)?.TeamMember.role,
    annotations: team.annotations ?? {},
  }));
}
