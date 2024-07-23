import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Team, TeamMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function getTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { teamId },
  } = ctx;

  const team = await Team.findByPk(teamId);

  assertKoaError(!team, ctx, 404, 'Team not found');

  const appMember = await checkAuthSubjectAppPermissions(ctx, team.AppId, [
    AppPermission.QueryTeams,
  ]);

  let teamMember;
  if (appMember) {
    teamMember = await TeamMember.findOne({
      where: {
        AppMemberId: appMember.id,
      },
    });
  }

  ctx.body = {
    id: team.id,
    name: team.name,
    role: teamMember?.role,
    ...(team.annotations && { annotations: team.annotations }),
  };
}
