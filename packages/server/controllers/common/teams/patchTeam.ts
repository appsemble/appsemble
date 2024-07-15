import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Team, TeamMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

// TODO: When updating on a team in the studio, the UI must handle opening the
//  Appsemble OAuth2 login flow to ensure there is an app member for the user
export async function patchTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, teamId },
    request: {
      body: { annotations, name },
    },
  } = ctx;

  const appMember = await checkAuthSubjectAppPermissions(ctx, appId, [AppPermission.UpdateTeams]);

  const team = await Team.findByPk(teamId);

  assertKoaError(!team, ctx, 404, 'Team not found');

  await team.update({ name: name || undefined, annotations: annotations || undefined });

  const teamMember = await TeamMember.findOne({
    where: { AppMemberId: appMember.id },
  });

  ctx.body = {
    id: team.id,
    role: teamMember.role,
    name,
    ...(annotations && { annotations }),
  };
}
