import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppMember, Team, TeamMember } from '../../../../../models/index.js';

export async function getAppTeamMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, teamId },
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      {
        model: TeamMember,
        include: [
          {
            model: AppMember,
            attributes: ['id', 'name', 'email'],
          },
        ],
      },
    ],
  });

  assertKoaError(!team, ctx, 404, 'Team not found.');

  ctx.body = team.Members.map((member) => ({
    id: member.AppMember.id,
    name: member.AppMember.name,
    primaryEmail: member.AppMember.email,
    role: member.role,
  }));
}
