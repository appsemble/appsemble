import { Permission, TeamRole } from '@appsemble/utils';
import { badRequest, forbidden, notFound } from '@hapi/boom';
import { Context } from 'koa';
import { validate } from 'uuid';

import { App, Organization, Team, TeamMember, transactional, User } from '../models';
import { checkRole } from '../utils/checkRole';

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

export async function createTeam(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { name },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId);
  if (!app) {
    throw notFound('App not found.');
  }

  if (!app.definition.security) {
    throw badRequest('App does not have a security definition.');
  }

  await checkRole(ctx, app.OrganizationId, Permission.ManageTeams);

  let team: Team;
  await transactional(async (transaction) => {
    team = await Team.create({ name, AppId: appId }, { transaction });
    await TeamMember.create(
      { TeamId: team.id, UserId: user.id, role: TeamRole.Manager },
      { transaction },
    );
  });

  ctx.body = {
    id: team.id,
    name: team.name,
    role: TeamRole.Manager,
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

  await team.update({ ...(name && { name }), ...(annotations && { annotations }) });
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
    include: [{ model: User }],
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

export async function addTeamMember(ctx: Context): Promise<void> {
  const {
    clients,
    pathParams: { appId, teamId },
    request: {
      body: { id },
    },
    user,
  } = ctx;
  const isUuid = validate(id);
  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      { model: User, where: isUuid ? { id } : { primaryEmail: id }, required: false },
      {
        model: App,
        include: [
          { model: User, where: isUuid ? { id } : { primaryEmail: id }, required: false },
          {
            model: Organization,
            include: [
              { model: User, where: isUuid ? { id } : { primaryEmail: id }, required: false },
            ],
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
      throw forbidden('App users may only modify add themselves as team member');
    }
  } else {
    try {
      await checkRole(ctx, team.App.OrganizationId, Permission.ManageTeams);
    } catch {
      await checkTeamPermission(ctx, team);
    }
  }

  if (
    !team.App.Users.length &&
    (team.App.definition.security.default.policy === 'invite' ||
      !team.App.Organization.Users.length)
  ) {
    throw notFound(`User with id ${id} is not part of this app’s members.`);
  }

  if (team.Users.length) {
    throw badRequest('This user is already a member of this team.');
  }

  const [member] = team.App.Users.length ? team.App.Users : team.App.Organization.Users;
  await TeamMember.create({ UserId: member.id, TeamId: team.id, role: TeamRole.Member });
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

  const isUuid = validate(memberId);
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
  const isUuid = validate(memberId);
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
