import { TeamRole } from '@appsemble/utils/src';
import { badRequest, notFound } from '@hapi/boom';

import { Organization, Team, TeamMember, User } from '../models';
import { KoaContext } from '../types';

interface Params {
  memberId: string;
  organizationId: string;
  teamId: number;
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
  };
}

export async function getTeams(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { organizationId },
    user,
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    include: [{ model: Team, include: [{ model: User, where: { id: user.id }, required: false }] }],
  });
  if (!organization) {
    throw notFound('Organization not found.');
  }

  ctx.body = organization.Teams.map(({ id, name }) => ({ id, name }));
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

  await team.update({ name });
  ctx.body = { id: team.id, name };
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

  await team.destroy();
}

export async function getTeamMembers(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { organizationId, teamId },
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, OrganizationId: organizationId },
    include: [{ model: User, include: [{ model: TeamMember }] }],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  ctx.body = team.Users.map((user) => ({
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role: user.Member.role,
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
      { model: User, where: { id } },
      { model: Organization, include: [{ model: User, where: { id }, required: false }] },
    ],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  if (!team.Organization.Users.length) {
    throw notFound(`User with id ${id} is not part of this team’s organization.`);
  }

  if (team.Users.length) {
    throw badRequest('This user is already a member of this team.');
  }

  const [user] = team.Organization.Users;
  await TeamMember.create({ UserId: id, OrganizationId: organizationId, role: TeamRole.Member });
  ctx.body = {
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role: TeamRole.Member,
  };
}

export async function removeTeamMember(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { organizationId, teamId },
    request: {
      body: { id },
    },
  } = ctx;

  const team = await Team.findOne({
    where: { id: teamId, OrganizationId: organizationId },
    include: [{ model: User, where: { id } }],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  if (!team.Users.length) {
    throw badRequest('This user is not a member of this team.');
  }

  await TeamMember.destroy({ where: { UserId: id, OrganizationId: organizationId } });
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
    include: [{ model: User, where: { id: memberId } }],
  });

  if (!team) {
    throw notFound('Team not found.');
  }

  if (!team.Users.length) {
    throw badRequest('This user is not a member of this team.');
  }

  await TeamMember.update(
    { role },
    { where: { UserId: memberId, OrganizationId: organizationId } },
  );

  const [user] = team.Users;

  ctx.body = {
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role,
  };
}
