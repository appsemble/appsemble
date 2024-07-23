import { assertKoaError } from '@appsemble/node-utils';
import { TeamPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { TeamMember } from '../../../models/index.js';
import { checkAuthSubjectTeamPermissions } from '../../../utils/authorization.js';

export async function removeTeamMember(ctx: Context): Promise<void> {
  const {
    pathParams: { teamMemberId },
  } = ctx;

  const teamMember = await TeamMember.findByPk(teamMemberId);

  assertKoaError(!teamMember, ctx, 404, 'Team member not found.');

  await checkAuthSubjectTeamPermissions(ctx, teamMember.TeamId, [TeamPermission.RemoveTeamMembers]);

  await teamMember.destroy();
}
