import { randomBytes } from 'node:crypto';

import { createGetTeams } from '@appsemble/node-utils';
import { checkAppRole, Permission, TeamRole, uuid4Pattern } from '@appsemble/utils';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  Organization,
  Team,
  TeamInvite,
  TeamMember,
  transactional,
  User,
} from '../models/index.js';
import { options } from '../options/options.js';
import { getAppUrl } from '../utils/app.js';
import { checkRole } from '../utils/checkRole.js';

async function checkTeamPermission(ctx: Context, team: Team): Promise<void> {
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
    ctx.response.status = 403;
    ctx.response.body = {
      statusCode: 403,
      error: 'Forbidden',
      message: 'User does not have sufficient permissions.',
    };
    ctx.throw();
  }
}

function assertTeamsDefinition(ctx: Context, app: App): asserts app {
  if (!app) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'App not found.',
    };
    ctx.throw();
  }

  if (!app.definition.security) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'App does not have a security definition.',
    };
    ctx.throw();
  }

  if (!app.definition.security.teams) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'App does not have a teams definition.',
    };
    ctx.throw();
  }
}

export async function createTeam(ctx: Context): Promise<void> {
  const {
    clients,
    pathParams: { appId },
    request: {
      body: { annotations, name },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition', 'OrganizationId', 'id'],
    include:
      'app' in clients
        ? [
            {
              model: AppMember,
              required: false,
              where: { UserId: user.id },
              attributes: ['role', 'UserId', 'id'],
            },
          ]
        : [],
  });
  assertTeamsDefinition(ctx, app);

  if ('app' in clients) {
    const appMember = app.AppMembers.find((member) => member.UserId === user.id);
    if (!appMember) {
      ctx.response.status = 403;
      ctx.response.body = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'User is not an app member',
      };
      ctx.throw();
    }
    if (
      !app.definition.security.teams.create.some((teamName) =>
        checkAppRole(app.definition.security, teamName, appMember.role, appMember.TeamMembers),
      )
    ) {
      ctx.response.status = 403;
      ctx.response.body = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'User is not allowed to create teams',
      };
      ctx.throw();
    }
  } else {
    await checkRole(ctx, app.OrganizationId, Permission.ManageTeams);
  }

  let team: Team;
  await transactional(async (transaction) => {
    team = await Team.create(
      { name, AppId: appId, annotations: annotations || undefined },
      { transaction },
    );
    let member =
      app.AppMembers?.[0] ||
      (await AppMember.findOne({ where: { AppId: app.id, UserId: user.id } }));

    if (!member) {
      const completeUser = await User.findByPk(user.id);
      member = await AppMember.create(
        {
          UserId: completeUser.id,
          AppId: app.id,
          role: app.definition.security.default.role,
          name: completeUser.name,
          email: completeUser.primaryEmail,
        },
        { transaction },
      );
    }
    await TeamMember.create(
      { TeamId: team.id, AppMemberId: member.id, role: TeamRole.Manager },
      { transaction },
    );
  });

  ctx.body = {
    id: team.id,
    name: team.name,
    role: TeamRole.Manager,
    annotations: team.annotations ?? {},
  };
}

export async function getTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, teamId },
    user,
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      {
        model: TeamMember,
        required: false,
        include: [
          {
            model: AppMember,
            where: { UserId: user.id },
            required: false,
          },
        ],
      },
    ],
  });

  if (!team) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Team not found.',
    };
    ctx.throw();
  }

  ctx.body = {
    id: team.id,
    name: team.name,
    ...(team.Members.length && { role: team.Members[0].role }),
    ...(team.annotations && { annotations: team.annotations }),
  };
}

export const getTeams = createGetTeams(options);

export async function patchTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, teamId },
    request: {
      body: { annotations, name },
    },
    user,
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      {
        model: TeamMember,
        required: false,
        include: [{ model: AppMember, where: { UserId: user.id } }],
      },
      { model: App, attributes: ['OrganizationId'] },
    ],
  });

  if (!team) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Team not found.',
    };
    ctx.throw();
  }

  await checkRole(ctx, team.App.OrganizationId, Permission.ManageTeams);

  await team.update({ name: name || undefined, annotations: annotations || undefined });
  ctx.body = {
    id: team.id,
    name,
    ...(annotations && { annotations }),
    ...(team.Members.length && { role: team.Members[0].role }),
  };
}

export async function deleteTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, teamId },
    user,
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      {
        model: TeamMember,
        required: false,
        include: [{ model: AppMember, where: { UserId: user.id } }],
      },
      { model: App, attributes: ['OrganizationId'] },
    ],
  });

  if (!team) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Team not found',
    };
    ctx.throw();
  }

  await checkRole(ctx, team.App.OrganizationId, Permission.ManageTeams);

  await team.destroy();
}

export async function getTeamMembers(ctx: Context): Promise<void> {
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
            attributes: ['id', 'name', 'email', 'UserId'],
          },
        ],
      },
    ],
  });

  if (!team) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Team not found.',
    };
    ctx.throw();
  }

  ctx.body = team.Members.map((member) => ({
    id: member.AppMember.UserId,
    name: member.AppMember.name,
    primaryEmail: member.AppMember.email,
    role: member.role,
  }));
}

export async function getTeamMember(ctx: Context): Promise<void> {
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

  if (!team) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Team not found',
    };
    ctx.throw();
  }

  const teamMember = team.Members.find((member) => member.AppMember.UserId === memberId);

  if (!teamMember) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'App member not found in team',
    };
    ctx.throw();
  }

  ctx.body = {
    id: teamMember.AppMember.UserId,
    name: teamMember.AppMember.name,
    primaryEmail: teamMember.AppMember.email,
    role: teamMember.role,
  };
}

export async function inviteTeamMember(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId, teamId },
    request: {
      body: { email, role = 'member' },
    },
    user,
  } = ctx;

  const app = await App.findOne({
    attributes: ['id', 'definition', 'path', 'OrganizationId', 'domain'],
    where: { id: appId },
    include: [
      { model: Team, required: false, where: { id: teamId } },
      { model: AppMember, required: false, attributes: ['role'], where: { UserId: user.id } },
    ],
  });
  assertTeamsDefinition(ctx, app);

  if (app.definition.security.teams.join !== 'invite') {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Team invites are not supported',
    };
    ctx.throw();
  }

  if (!app.Teams?.length) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: `Team ${teamId} does not exist`,
    };
    ctx.throw();
  }

  const teamMembers = await TeamMember.findAll({
    where: { TeamId: teamId },
    include: { model: AppMember, where: { UserId: user.id } },
  });
  const [appMember] = app.AppMembers;
  if (
    !app.definition.security.teams.invite.some((r) =>
      checkAppRole(app.definition.security, r, appMember?.role, teamMembers),
    )
  ) {
    ctx.response.status = 403;
    ctx.response.body = {
      statusCode: 403,
      error: 'Forbidden',
      message: 'User is not allowed to invite members to this team',
    };
    ctx.throw();
  }

  const invite = await TeamInvite.create({
    email: email.trim().toLowerCase(),
    TeamId: teamId,
    key: randomBytes(20).toString('hex'),
    role,
  });
  const url = new URL('/Team-Invite', getAppUrl(app));
  url.searchParams.set('code', invite.key);
  await mailer.sendTemplateEmail({ email: invite.email }, 'teamInvite', {
    appName: app.definition.name,
    teamName: app.Teams[0].name,
    url: String(url),
  });
}

export async function getTeamInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { code },
  } = ctx;

  const invite = await TeamInvite.findOne({
    where: { key: code },
    include: [{ model: Team, where: { AppId: appId } }],
  });

  if (!invite) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: `No invite found for code: ${code}`,
    };
    ctx.throw();
  }

  ctx.body = invite;
}

export async function addTeamMember(ctx: Context): Promise<void> {
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
        attributes: ['OrganizationId', 'definition'],
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

  if (!team) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Team not found.',
    };
    ctx.throw();
  }

  // Allow app members to add themselves to a team.
  if ('app' in clients) {
    if (id !== user.id && id !== user.primaryEmail) {
      ctx.response.status = 403;
      ctx.response.body = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'App members may only add themselves as team member',
      };
      ctx.throw();
    }
    if (team.App.definition.security?.teams.join === 'invite') {
      ctx.response.status = 403;
      ctx.response.body = {
        statusCode: 403,
        error: 'Forbidden',
        message: 'You need an invite to join this team',
      };
      ctx.throw();
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
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: `App member with id ${id} is not part of this app’s members.`,
    };
    ctx.throw();
  }

  if (team.Members.length) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'This app member is already a member of this team.',
    };
    ctx.throw();
  }

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

export async function removeTeamMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId, teamId },
  } = ctx;

  const isUuid = uuid4Pattern.test(memberId);
  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      {
        model: TeamMember,
        include: [{ model: AppMember, where: isUuid ? { UserId: memberId } : { email: memberId } }],
        required: false,
      },
      { model: App, attributes: ['OrganizationId'] },
    ],
  });

  if (!team) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Team not found',
    };
    ctx.throw();
  }

  try {
    await checkRole(ctx, team.App.OrganizationId, Permission.ManageTeams);
  } catch {
    await checkTeamPermission(ctx, team);
  }

  if (!team.Members.length) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'This user is not a member of this team.',
    };
    ctx.throw();
  }

  await team.Members[0].destroy();
}

export async function updateTeamMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId, teamId },
    request: {
      body: { role },
    },
  } = ctx;
  const isUuid = uuid4Pattern.test(memberId);
  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      {
        model: TeamMember,
        required: false,
        include: [{ model: AppMember, where: isUuid ? { UserId: memberId } : { email: memberId } }],
      },
      { model: App, attributes: ['OrganizationId'] },
    ],
  });

  if (!team) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Team not found.',
    };
    ctx.throw();
  }

  try {
    await checkRole(ctx, team.App.OrganizationId, Permission.ManageTeams);
  } catch {
    await checkTeamPermission(ctx, team);
  }

  if (!team.Members.length) {
    ctx.response.status = 400;
    ctx.response.body = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'This user is not a member of this team.',
    };
    ctx.throw();
  }

  const [member] = team.Members;
  await member.update({ role });

  ctx.status = 200;
  ctx.body = {
    id: member.AppMember.UserId,
    name: member.AppMember.name,
    primaryEmail: member.AppMember.email,
    role,
  };
}

export async function acceptTeamInvite(ctx: Context): Promise<void> {
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

  if (!invite) {
    ctx.response.status = 404;
    ctx.response.body = {
      statusCode: 404,
      error: 'Not Found',
      message: `No invite found for code: ${code}`,
    };
    ctx.throw();
  }

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
