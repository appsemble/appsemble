import { assertKoaError } from '@appsemble/node-utils';
import { TeamPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppMember, TeamMember } from '../../../../models/index.js';
import { checkAuthSubjectTeamPermissions } from '../../../../utils/authorization.js';

export async function updateTeamMember(ctx: Context): Promise<void> {
  const {
    pathParams: { teamId, teamMemberId },
    request: {
      body: { role },
    },
  } = ctx;

  await checkAuthSubjectTeamPermissions(ctx, teamId, [TeamPermission.UpdateTeamMembers]);

  const teamMember = await TeamMember.findByPk(teamMemberId, {
    include: [{ model: AppMember }],
  });

  assertKoaError(!teamMember, ctx, 404, 'Member not found in team');

  await teamMember.update({ role });

  ctx.status = 200;
  ctx.body = {
    id: teamMember.id,
    name: teamMember.AppMember.name,
    primaryEmail: teamMember.AppMember.email,
    role,
  };
}
