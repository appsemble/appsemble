import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppMember, Team, TeamMember, type User } from '../../../../models/index.js';

export async function getAppTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, teamId },
    user,
  } = ctx;

  await (user as User).reload({ attributes: ['id', 'primaryEmail'] });

  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      {
        model: TeamMember,
        required: false,
        include: [
          {
            model: AppMember,
            where: { email: user.primaryEmail },
            required: false,
          },
        ],
      },
    ],
  });

  assertKoaError(!team, ctx, 404, 'Team not found.');

  ctx.body = {
    id: team.id,
    name: team.name,
    ...(team.Members.length && { role: team.Members[0].role }),
    ...(team.annotations && { annotations: team.annotations }),
  };
}
