import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { TeamRole } from '@appsemble/utils';
import { type Context } from 'koa';

import { type App, AppMember, Team, TeamMember } from '../models/index.js';

export async function checkTeamPermission(ctx: Context, team: Team): Promise<void> {
  const {
    pathParams: { teamId },
    user,
  } = ctx;

  const teamMember =
    team?.Members.find((m) => m.AppMember?.UserId === user.id) ??
    (await Team.findOne({
      where: { id: teamId },
      include: {
        model: TeamMember,
        include: [{ model: AppMember }],
      },
    }).then((t) => t.Members.find((m) => m.AppMember.UserId === user.id)));

  if (!teamMember || teamMember.role !== TeamRole.Manager) {
    throwKoaError(ctx, 403, 'User does not have sufficient permissions.');
  }
}

export function assertTeamsDefinition(ctx: Context, app: App): asserts app {
  assertKoaError(!app, ctx, 404, 'App not found.');
  assertKoaError(!app.definition.security, ctx, 400, 'App does not have a security definition.');
  assertKoaError(!app.definition.security.teams, ctx, 400, 'App does not have a teams definition.');
}
