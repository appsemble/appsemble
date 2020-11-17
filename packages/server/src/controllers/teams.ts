import { Permission, TeamRole } from '@appsemble/utils';
import { badRequest, forbidden, notFound, unauthorized } from '@hapi/boom';

import { Organization, Team, TeamMember, User } from '../models';
import { KoaContext } from '../types';
import { checkRole } from '../utils/checkRole';

interface Params {
  memberId: string;
  organizationId: string;
  teamId: number;
}

async function checkTeamPermission(ctx: KoaContext<Params>, team: Team): Promise<void> {
  const {
    params: { teamId },
    user,
  } = ctx;
  if (!user) {
    throw unauthorized();
  }

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
    params: { organizationId },
    request: {
      body: { name },
    },
    user,
  } = ctx;

  const organization = await Organization.count({ where: { id: organizationId } });
  if (!organization) {
    throw notFound('Organization not found.');
  }

  await checkRole(ctx, organizationId, Permission.ManageMembers);

  const team = await Team.create({ name, OrganizationId: organizationId });
  await TeamMember.create({ TeamId: team.id, UserId: user.id, role: TeamRole.Manager });

  ctx.body = {
    id: team.id,
    name: team.name,
    role: TeamRole.Manager,
  };
}

export async function getTeam(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { organizationId, teamId },
    user,
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, OrganizationId: organizationId },
    include: [{ model: User, where: { id: user.id }, required: false }],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  ctx.body = {
    id: team.id,
    name: team.name,
    ...(team.Users.length && { role: team.Users[0].TeamMember.role }),
  };
}

export async function getTeams(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { organizationId },
    user,
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    include: [
      {
        model: Team,
        include: [{ model: User, where: { id: user.id }, required: false }],
      },
    ],
  });
  if (!organization) {
    throw notFound('Organization not found.');
  }

  ctx.body = organization.Teams.map((team) => ({
    id: team.id,
    name: team.name,
    ...(team.Users.length && { role: team.Users[0].TeamMember.role }),
  }));
}

export async function updateTeam(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { organizationId, teamId },
    request: {
      body: { name },
    },
    user,
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, OrganizationId: organizationId },
    include: [{ model: User, where: { id: user.id }, required: false }],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  await checkRole(ctx, organizationId, Permission.ManageMembers);

  await team.update({ name });
  ctx.body = {
    id: team.id,
    name,
    ...(team.Users.length && { role: team.Users[0].TeamMember.role }),
  };
}

export async function deleteTeam(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { organizationId, teamId },
    user,
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, OrganizationId: organizationId },
    include: [{ model: User, where: { id: user.id }, required: false }],
  });
  if (!team) {
    throw notFound('Team not found.');
  }

  await checkRole(ctx, organizationId, Permission.ManageMembers);

  await team.destroy();
}

export async function getTeamMembers(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { organizationId, teamId },
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, OrganizationId: organizationId },
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
    params: { organizationId, teamId },
    request: {
      body: { id },
    },
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, OrganizationId: organizationId },
    include: [
      { model: User, where: { id }, required: false },
      { model: Organization, include: [{ model: User, where: { id }, required: false }] },
    ],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  try {
    await checkRole(ctx, organizationId, Permission.InviteMember);
  } catch {
    await checkTeamPermission(ctx, team);
  }

  if (!team.Organization.Users.length) {
    throw notFound(`User with id ${id} is not part of this team’s organization.`);
  }

  if (team.Users.length) {
    throw badRequest('This user is already a member of this team.');
  }

  const [user] = team.Organization.Users;
  await TeamMember.create({ UserId: id, TeamId: team.id, role: TeamRole.Member });
  ctx.body = {
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role: TeamRole.Member,
  };
}

export async function removeTeamMember(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { memberId, organizationId, teamId },
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, OrganizationId: organizationId },
    include: [{ model: User, where: { id: memberId }, required: false }],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  try {
    await checkRole(ctx, organizationId, Permission.InviteMember);
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
    params: { memberId, organizationId, teamId },
    request: {
      body: { role },
    },
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, OrganizationId: organizationId },
    include: [{ model: User, where: { id: memberId }, required: false }],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  try {
    await checkRole(ctx, organizationId, Permission.InviteMember);
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
