import { assertKoaError } from '@appsemble/node-utils';
import { TeamPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppMember, Team, TeamMember } from '../../../../models/index.js';
import { checkAuthSubjectTeamPermissions } from '../../../../utils/authorization.js';

export async function getTeamMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { teamId },
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId },
  });

  assertKoaError(!team, ctx, 404, 'Team not found.');

  await checkAuthSubjectTeamPermissions(ctx, teamId, [TeamPermission.QueryTeamMembers]);

  const teamMembers = await TeamMember.findAll({
    where: { TeamId: teamId },
    include: [
      {
        model: AppMember,
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  ctx.body = teamMembers.map((teamMember) => ({
    id: teamMember.AppMember.id,
    name: teamMember.AppMember.name,
    primaryEmail: teamMember.AppMember.email,
    role: teamMember.role,
  }));
}
