import { assertKoaError } from '@appsemble/node-utils';
import { TeamPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { TeamMember } from '../../../../models/index.js';
import { checkAuthSubjectTeamPermissions } from '../../../../utils/authorization.js';

export async function removeTeamMember(ctx: Context): Promise<void> {
  const {
    pathParams: { teamId, teamMemberId },
  } = ctx;

  await checkAuthSubjectTeamPermissions(ctx, teamId, [TeamPermission.RemoveTeamMembers]);

  const teamMember = await TeamMember.findByPk(teamMemberId);

  assertKoaError(!teamMember, ctx, 404, 'Member not found in team');

  await teamMember.destroy();
}
