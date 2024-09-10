import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppMember, Team, TeamMember } from '../../../../../models/index.js';

export async function getAppTeamMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId, teamId },
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      {
        model: TeamMember,
        include: [{ model: AppMember, attributes: ['id', 'name', 'email', 'UserId'] }],
      },
    ],
  });

  assertKoaError(!team, ctx, 404, 'Team not found.');

  const teamMember = team.Members.find((member) => member.AppMember.UserId === memberId);

  assertKoaError(!teamMember, ctx, 404, 'App member not found in team');

  ctx.body = {
    id: teamMember.AppMember.UserId,
    name: teamMember.AppMember.name,
    primaryEmail: teamMember.AppMember.email,
    role: teamMember.role,
  };
}
