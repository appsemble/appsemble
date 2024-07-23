import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Team, TeamMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function patchTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { teamId },
    request: {
      body: { annotations, name },
    },
  } = ctx;

  const team = await Team.findByPk(teamId);

  assertKoaError(!team, ctx, 404, 'Team not found');

  const appMember = await checkAuthSubjectAppPermissions(ctx, team.AppId, [
    AppPermission.UpdateTeams,
  ]);

  await team.update({ name: name || undefined, annotations: annotations || undefined });

  let teamMember;
  if (appMember) {
    teamMember = await TeamMember.findOne({
      where: { AppMemberId: appMember.id },
    });
  }

  ctx.body = {
    id: team.id,
    role: teamMember?.role,
    name,
    ...(annotations && { annotations }),
  };
}
