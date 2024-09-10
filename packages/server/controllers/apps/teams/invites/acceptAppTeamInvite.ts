import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  Team,
  TeamInvite,
  TeamMember,
  transactional,
} from '../../../../models/index.js';

export async function acceptAppTeamInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { code },
    },
    user,
  } = ctx;

  const invite = await TeamInvite.findOne({
    where: { key: code },
    include: [
      {
        model: Team,
        where: { AppId: appId },
        include: [
          {
            model: App,
            attributes: ['id', 'definition'],
            required: false,
            include: [{ model: AppMember, where: { UserId: user.id }, required: false }],
          },
        ],
      },
    ],
  });

  assertKoaError(!invite, ctx, 404, `No invite found for code: ${code}`);

  const app = invite.Team.App;
  await transactional(async (transaction) =>
    Promise.all([
      TeamMember.create(
        {
          AppMemberId:
            app.AppMembers[0]?.id ||
            (
              await AppMember.create(
                {
                  email: invite.email,
                  AppId: app.id,
                  UserId: user.id,
                  role: app.definition.security.default.role,
                },
                { transaction },
              )
            ).id,
          role: invite.role,
          TeamId: invite.TeamId,
        },
        { transaction },
      ),
      invite.destroy({ transaction }),
    ]),
  );

  const { Team: team } = invite;
  ctx.body = {
    id: team.id,
    name: team.name,
    role: invite.role,
    annotations: team.annotations ?? {},
  };
}
