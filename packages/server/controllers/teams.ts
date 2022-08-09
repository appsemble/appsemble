import { randomBytes } from 'crypto';

import { checkAppRole, Permission, TeamRole, uuid4Pattern } from '@appsemble/utils';
import { badRequest, forbidden, notFound } from '@hapi/boom';
import { Context } from 'koa';

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
import { getAppUrl } from '../utils/app.js';
import { checkRole } from '../utils/checkRole.js';

async function checkTeamPermission(ctx: Context, team: Team): Promise<void> {
  const {
    pathParams: { teamId },
    user,
  } = ctx;
  const teamMember =
    team?.Users.find((u) => u.id === user.id)?.TeamMember ??
    (await TeamMember.findOne({
      where: { UserId: user.id, TeamId: teamId },
    }));

  if (!teamMember || teamMember.role !== TeamRole.Manager) {
    throw forbidden('User does not have sufficient permissions.');
  }
}

function assertTeamsDefinition(app: App): asserts app {
  if (!app) {
    throw notFound('App not found.');
  }

  if (!app.definition.security) {
    throw badRequest('App does not have a security definition.');
  }

  if (!app.definition.security.teams) {
    throw badRequest('App does not have a teams definition.');
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
    attributes: ['definition', 'OrganizationId'],
    include:
      'app' in clients
        ? [
            {
              model: AppMember,
              required: false,
              where: { UserId: user.id },
              attributes: ['role'],
              include: [
                {
                  model: User,
                  attributes: ['id'],
                  include: [{ model: TeamMember, required: false }],
                },
              ],
            },
          ]
        : [],
  });
  assertTeamsDefinition(app);

  if ('app' in clients) {
    const appMember = app.AppMembers.find((member) => member.User.id === user.id);
    if (!appMember) {
      throw forbidden('User is not an app member');
    }
    if (
      !app.definition.security.teams.create.some((teamName) =>
        checkAppRole(app.definition.security, teamName, appMember.role, appMember.User.TeamMembers),
      )
    ) {
      throw forbidden('User is not allowed to create teams');
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
    await TeamMember.create(
      { TeamId: team.id, UserId: user.id, role: TeamRole.Manager },
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
    include: [{ model: User, where: { id: user.id }, required: false }],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  ctx.body = {
    id: team.id,
    name: team.name,
    ...(team.Users.length && { role: team.Users[0].TeamMember.role }),
    ...(team.annotations && { annotations: team.annotations }),
  };
}

export async function getTeams(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: [],
    include: [
      {
        model: Team,
        include: [{ model: User, required: false }],
        order: [['name', 'ASC']],
      },
    ],
  });
  if (!app) {
    throw notFound('App not found.');
  }

  ctx.body = app.Teams.map((team) => ({
    id: team.id,
    name: team.name,
    size: team.Users.length,
    role: team.Users.find((u) => u.id === user.id)?.TeamMember.role,
    annotations: team.annotations ?? {},
  }));
}

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
      { model: User, where: { id: user.id }, required: false },
      { model: App, attributes: ['OrganizationId'] },
    ],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  await checkRole(ctx, team.App.OrganizationId, Permission.ManageTeams);

  await team.update({ name: name || undefined, annotations: annotations || undefined });
  ctx.body = {
    id: team.id,
    name,
    ...(annotations && { annotations }),
    ...(team.Users.length && { role: team.Users[0].TeamMember.role }),
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
      { model: User, where: { id: user.id }, required: false },
      { model: App, attributes: ['OrganizationId'] },
    ],
  });
  if (!team) {
    throw notFound('Team not found.');
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
    include: [{ model: User, attributes: ['id', 'name', 'primaryEmail'] }],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  ctx.body = team.Users.map((user) => ({
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role: user.TeamMember.role,
  }));
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
  assertTeamsDefinition(app);

  if (app.definition.security.teams.join !== 'invite') {
    throw badRequest('Team invites are not supported');
  }

  if (!app.Teams?.length) {
    throw badRequest(`Team ${teamId} does not exist`);
  }

  const teamMembers = await TeamMember.findAll({ where: { UserId: user.id, TeamId: teamId } });
  const [appMember] = app.AppMembers;
  if (
    !app.definition.security.teams.invite.some((r) =>
      checkAppRole(app.definition.security, r, appMember?.role, teamMembers),
    )
  ) {
    throw forbidden('User is not allowed to invite members to this team');
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
    throw notFound(`No invite found for code ${code}`);
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
      { model: User, where: userQuery, required: false },
      {
        model: App,
        attributes: ['OrganizationId', 'definition'],
        include: [
          {
            model: Organization,
            attributes: ['id'],
            include: [{ model: User, where: userQuery, required: false }],
          },
          {
            model: AppMember,
            attributes: ['id'],
            required: false,
            include: [{ model: User, where: userQuery, required: true }],
          },
        ],
      },
    ],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  // Allow app users to add themselves to a team.
  if ('app' in clients) {
    if (id !== user.id && id !== user.primaryEmail) {
      throw forbidden('App users may only add themselves as team member');
    }
    if (team.App.definition.security?.teams.join === 'invite') {
      throw forbidden('You need an invite to join this team');
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
    throw notFound(`User with id ${id} is not part of this app’s members.`);
  }

  if (team.Users.length) {
    throw badRequest('This user is already a member of this team.');
  }

  const member = team.App.AppMembers[0]?.User ?? team.App.Organization.Users[0];
  await TeamMember.create({ UserId: member.id, TeamId: team.id, role: TeamRole.Member });

  if ('app' in clients) {
    // XXX: Separate app and studio responses.
    ctx.body = {
      id: team.id,
      name: team.name,
      role: TeamRole.Member,
      annotations: team.annotations ?? {},
    };

    return;
  }
  ctx.body = {
    id: member.id,
    name: member.name,
    primaryEmail: member.primaryEmail,
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
        model: User,
        where: isUuid ? { id: memberId } : { primaryEmail: memberId },
        required: false,
      },
      { model: App, attributes: ['OrganizationId'] },
    ],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  try {
    await checkRole(ctx, team.App.OrganizationId, Permission.ManageTeams);
  } catch {
    await checkTeamPermission(ctx, team);
  }

  if (!team.Users.length) {
    throw badRequest('This user is not a member of this team.');
  }

  await TeamMember.destroy({ where: { UserId: team.Users[0].id, TeamId: team.id } });
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
        model: User,
        where: isUuid ? { id: memberId } : { primaryEmail: memberId },
        required: false,
      },
      { model: App, attributes: ['OrganizationId'] },
    ],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  try {
    await checkRole(ctx, team.App.OrganizationId, Permission.ManageTeams);
  } catch {
    await checkTeamPermission(ctx, team);
  }

  if (!team.Users.length) {
    throw badRequest('This user is not a member of this team.');
  }

  const [user] = team.Users;
  await TeamMember.update({ role }, { where: { UserId: user.id, TeamId: team.id } });

  ctx.body = {
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
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
    include: [{ model: Team, where: { AppId: appId } }],
  });

  if (!invite) {
    throw notFound(`No invite found for code: ${code}`);
  }

  await TeamMember.create({
    UserId: user.id,
    role: invite.role,
    TeamId: invite.TeamId,
  });
  await invite.destroy();

  const { Team: team } = invite;
  ctx.body = {
    id: team.id,
    name: team.name,
    role: invite.role,
    annotations: team.annotations ?? {},
  };
}
