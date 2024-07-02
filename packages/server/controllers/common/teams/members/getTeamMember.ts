import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppMember, Team, TeamMember } from '../../../../models/index.js';

export async function getTeamMember(ctx: Context): Promise<void> {
  const {
    pathParams: { teamId, teamMemberId },
  } = ctx;

  const team = await Team.findByPk(teamId);

  assertKoaError(!team, ctx, 404, 'Team not found');

  const teamMember = await TeamMember.findByPk(teamMemberId, {
    include: {
      model: AppMember,
    },
  });

  assertKoaError(!teamMember, ctx, 404, 'Member not found in team');

  ctx.body = {
    id: teamMember.id,
    name: teamMember.AppMember.name,
    primaryEmail: teamMember.AppMember.email,
    role: teamMember.role,
  };
}
