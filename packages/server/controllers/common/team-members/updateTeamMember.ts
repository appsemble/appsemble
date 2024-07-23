import { assertKoaError } from '@appsemble/node-utils';
import { TeamPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppMember, TeamMember } from '../../../models/index.js';
import { checkAuthSubjectTeamPermissions } from '../../../utils/authorization.js';

export async function updateTeamMember(ctx: Context): Promise<void> {
  const {
    pathParams: { teamMemberId },
    request: {
      body: { role },
    },
  } = ctx;

  const teamMember = await TeamMember.findByPk(teamMemberId, {
    include: [{ model: AppMember }],
  });

  assertKoaError(!teamMember, ctx, 404, 'Team member not found.');

  await checkAuthSubjectTeamPermissions(ctx, teamMember.TeamId, [TeamPermission.UpdateTeamMembers]);

  await teamMember.update({ role });

  ctx.status = 200;
  ctx.body = {
    id: teamMember.id,
    name: teamMember.AppMember.name,
    primaryEmail: teamMember.AppMember.email,
    role,
  };
}
