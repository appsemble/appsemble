import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { Permission, TeamRole, uuid4Pattern } from '@appsemble/utils';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  Organization,
  Team,
  TeamMember,
  User,
} from '../../../../../models/index.js';
import { checkRole } from '../../../../../utils/checkRole.js';
import { checkTeamPermission } from '../../../../../utils/team.js';

export async function addAppTeamMember(ctx: Context): Promise<void> {
  const {
    clients,
    pathParams: { appId, teamId },
    request: {
      body: { id },
    },
    user,
  } = ctx;
  const userQuery = {
    [uuid4Pattern.test(id) ? 'id' : 'primaryEmail']: id,
  };

  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      {
        model: TeamMember,
        required: false,
        include: [
          {
            model: AppMember,
            required: true,
            include: [{ model: User, where: userQuery, required: true }],
          },
        ],
      },
      {
        model: App,
        attributes: ['OrganizationId', 'definition', 'demoMode'],
        include: [
          {
            model: Organization,
            attributes: ['id'],
            include: [
              {
                model: User,
                required: false,
                where: userQuery,
                include: [
                  {
                    model: AppMember,
                    required: true,
                    where: { AppId: appId },
                    as: 'AppMembers',
                  },
                ],
              },
            ],
          },
          {
            model: AppMember,
            attributes: ['id', 'name', 'email', 'UserId'],
            required: false,
            include: [{ model: User, where: userQuery, required: true }],
          },
        ],
      },
    ],
  });

  assertKoaError(!team, ctx, 404, 'Team not found.');

  // Allow app members to add themselves to a team.
  if ('app' in clients) {
    if (id !== user.id && id !== user.primaryEmail) {
      throwKoaError(ctx, 403, 'App members may only add themselves as team member');
    }
    if (team.App.definition.security?.teams.join === 'invite' && !team.App.demoMode) {
      throwKoaError(ctx, 403, 'You need an invite to join this team');
    }
  } else {
    try {
      await checkRole(ctx, team.App.OrganizationId, Permission.ManageTeams);
    } catch {
      await checkTeamPermission(ctx, team);
    }
  }

  if (
    !team.App.AppMembers.length &&
    (team.App.definition.security.default.policy === 'invite' ||
      !team.App.Organization.Users.length)
  ) {
    throwKoaError(ctx, 404, `App member with id ${id} is not part of this app’s members.`);
  }

  assertKoaError(
    Boolean(team.Members.length),
    ctx,
    400,
    'This app member is already a member of this team.',
  );

  const member =
    team.App.AppMembers[0] ||
    (await AppMember.create({
      AppId: appId,
      UserId: team.App.Organization.Users[0].id,
      role: team.App.definition.security.default.role,
      name: team.App.Organization.Users[0].name,
    }));
  await TeamMember.create({
    AppMemberId: member.id,
    TeamId: team.id,
    role: TeamRole.Member,
  });

  if ('app' in clients) {
    // XXX: Separate app and studio responses.
    ctx.response.status = 201;
    ctx.body = {
      id: team.id,
      name: team.name,
      role: TeamRole.Member,
      annotations: team.annotations ?? {},
    };

    return;
  }
  ctx.response.status = 201;
  ctx.body = {
    id: member.UserId,
    name: member.name,
    primaryEmail: member.email,
    role: TeamRole.Member,
  };
}
