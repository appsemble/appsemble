import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { Team, TeamMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

// TODO: When clicking on a team in the studio, the UI must handle opening the
//  Appsemble OAuth2 login flow to ensure there is an app member for the user
export async function getTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, teamId },
  } = ctx;

  const appMember = await checkAuthSubjectAppPermissions(ctx, appId, []);

  const team = await Team.findByPk(teamId);

  assertKoaError(!team, ctx, 404, 'Team not found');

  const teamMember = await TeamMember.findOne({
    where: {
      AppMemberId: appMember.id,
    },
  });

  ctx.body = {
    id: team.id,
    name: team.name,
    role: teamMember.role,
    ...(team.annotations && { annotations: team.annotations }),
  };
}
