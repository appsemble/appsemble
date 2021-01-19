import { Permission, TeamRole } from '@appsemble/utils';
import { badRequest, forbidden, notFound } from '@hapi/boom';

import { App, Organization, Team, TeamMember, transactional, User } from '../models';
import { KoaContext } from '../types';
import { checkRole } from '../utils/checkRole';

interface Params {
  memberId: string;
  appId: string;
  teamId: number;
}

async function checkTeamPermission(ctx: KoaContext<Params>, team: Team): Promise<void> {
  const {
    params: { teamId },
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

export async function createTeam(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId },
    request: {
      body: { name },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId);
  if (!app) {
    throw notFound('App not found.');
  }

  await checkRole(ctx, app.OrganizationId, Permission.ManageMembers);

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

export async function getTeam(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, teamId },
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

export async function getTeams(ctx: KoaContext<Params>): Promise<void> {
  const {
    clients,
    params: { appId },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    include: [
      {
        model: Team,
        include: [{ model: User, required: false }],
      },
    ],
  });
  if (!app) {
    throw notFound('App not found.');
  }

  // Filter to just the user’s teams if it’s requested from an app.
  ctx.body = (clients.app
    ? app.Teams.filter((team) => team.Users.find((u) => u.id === user.id))
    : app.Teams
  ).map((team) => {
    const userRole = team.Users.find((u) => u.id === user.id);

    return {
      id: team.id,
      name: team.name,
      size: team.Users.length,
      ...(userRole && { role: userRole.TeamMember.role }),
      ...(team.annotations && { annotations: team.annotations }),
    };
  });
}

export async function updateTeam(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, teamId },
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

  await checkRole(ctx, team.App.OrganizationId, Permission.ManageMembers);

  await team.update({ name, ...(annotations && { annotations }) });
  ctx.body = {
    id: team.id,
    name,
    ...(annotations && { annotations }),
    ...(team.Users.length && { role: team.Users[0].TeamMember.role }),
  };
}

export async function deleteTeam(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, teamId },
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

  await checkRole(ctx, team.App.OrganizationId, Permission.ManageMembers);

  await team.destroy();
}

export async function getTeamMembers(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, teamId },
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

export async function addTeamMember(ctx: KoaContext<Params>): Promise<void> {
  const {
    clients,
    params: { appId, teamId },
    request: {
      body: { id },
    },
    user,
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      { model: User, where: { id }, required: false },
      {
        model: App,
        include: [
          { model: User, where: { id }, required: false },
          { model: Organization, include: [{ model: User, where: { id }, required: false }] },
        ],
      },
    ],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  // Allow app users to add themselves to a team.
  if ('app' in clients) {
    if (id !== user.id) {
      throw forbidden('App users may only modify add themselves as team member');
    }
  } else {
    try {
      await checkRole(ctx, team.App.OrganizationId, Permission.InviteMember);
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
  await TeamMember.create({ UserId: id, TeamId: team.id, role: TeamRole.Member });
  ctx.body = {
    id: member.id,
    name: member.name,
    primaryEmail: member.primaryEmail,
    role: TeamRole.Member,
  };
}

export async function removeTeamMember(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, memberId, teamId },
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      { model: User, where: { id: memberId }, required: false },
      { model: App, attributes: ['OrganizationId'] },
    ],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  try {
    await checkRole(ctx, team.App.OrganizationId, Permission.InviteMember);
  } catch {
    await checkTeamPermission(ctx, team);
  }

  if (!team.Users.length) {
    throw badRequest('This user is not a member of this team.');
  }

  await TeamMember.destroy({ where: { UserId: memberId, TeamId: team.id } });
}

export async function updateTeamMember(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { appId, memberId, teamId },
    request: {
      body: { role },
    },
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, AppId: appId },
    include: [
      { model: User, where: { id: memberId }, required: false },
      { model: App, attributes: ['OrganizationId'] },
    ],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  try {
    await checkRole(ctx, team.App.OrganizationId, Permission.InviteMember);
  } catch {
    await checkTeamPermission(ctx, team);
  }

  if (!team.Users.length) {
    throw badRequest('This user is not a member of this team.');
  }

  await TeamMember.update({ role }, { where: { UserId: memberId, TeamId: team.id } });

  const [user] = team.Users;

  ctx.body = {
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role,
  };
}
