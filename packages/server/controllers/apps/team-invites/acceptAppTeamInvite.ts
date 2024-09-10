import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  Team,
  TeamInvite,
  TeamMember,
  transactional,
} from '../../../models/index.js';

export async function acceptAppTeamInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { code },
    },
    user: authSubject,
  } = ctx;

  const app = await App.findByPk(appId);

  assertKoaError(!app, ctx, 404, 'App not found');

  const teamInvite = await TeamInvite.findOne({ where: { key: code } });

  assertKoaError(!teamInvite, ctx, 404, `No invite found for code: ${code}`);

  const appMember = await AppMember.findByPk(authSubject.id);

  if (appMember) {
    await transactional((transaction) =>
      Promise.all([
        TeamMember.create(
          {
            AppMemberId: appMember.id,
            role: teamInvite.role,
            TeamId: teamInvite.TeamId,
          },
          { transaction },
        ),
        teamInvite.destroy({ transaction }),
      ]),
    );
  }

  const team = await Team.findByPk(teamInvite.TeamId);

  ctx.body = {
    id: team.id,
    name: team.name,
    role: teamInvite.role,
    annotations: team.annotations ?? {},
  };
}
