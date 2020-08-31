import { randomBytes } from 'crypto';

import { Permission } from '@appsemble/utils';
import { badRequest, conflict, forbidden, notAcceptable, notFound } from '@hapi/boom';
import { Op, UniqueConstraintError } from 'sequelize';

import { EmailAuthorization, Organization, OrganizationInvite, User } from '../models';
import type { KoaContext } from '../types';
import { checkRole } from '../utils/checkRole';

interface Params {
  blockId: string;
  blockOrganizationId: string;
  memberId: string;
  organizationId: string;
  token: string;
}

export async function getOrganization(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { organizationId },
  } = ctx;

  const organization = await Organization.findByPk(organizationId);
  if (!organization) {
    throw notFound('Organization not found.');
  }

  ctx.body = {
    id: organization.id,
    name: organization.name,
  };
}

export async function createOrganization(ctx: KoaContext): Promise<void> {
  const {
    request: {
      body: { id, name },
    },
    user: { id: userId },
  } = ctx;

  const user = await User.findOne({
    attributes: ['primaryEmail', 'name'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
    where: { id: userId },
  });

  if (!user.primaryEmail || !user.EmailAuthorizations[0].verified) {
    throw forbidden('Email not verified.');
  }

  try {
    const organization = await Organization.create({ id, name }, { include: [User] });

    // @ts-expect-error XXX Convert to a type safe expression.
    await organization.addUser(userId, { through: { role: 'Owner' } });
    await organization.reload();

    ctx.body = {
      id: organization.id,
      name: organization.name,
      members: organization.Users.map((u) => ({
        id: u.id,
        name: u.name,
        primaryEmail: u.primaryEmail,
        role: 'Owner',
      })),
      invites: [],
    };
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throw conflict(`Another organization with the name “${name}” already exists`);
    }

    throw error;
  }
}

export async function getMembers(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { organizationId },
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    include: [User],
  });
  if (!organization) {
    throw notFound('Organization not found.');
  }

  ctx.body = organization.Users.map((user) => ({
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
    role: user.Member.role,
  }));
}

export async function getInvites(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { organizationId },
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    include: [OrganizationInvite],
  });
  if (!organization) {
    throw notFound('Organization not found.');
  }

  ctx.body = organization.OrganizationInvites.map((invite) => ({
    email: invite.email,
  }));
}

export async function getInvitation(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { token },
  } = ctx;

  const invite = await OrganizationInvite.findOne({
    where: { key: token },
  });

  if (!invite) {
    throw notFound('This token does not exist.');
  }

  const organization = await Organization.findByPk(invite.OrganizationId, { raw: true });

  ctx.body = { id: organization.id, name: organization.name };
}

export async function respondInvitation(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { organizationId },
    request: {
      body: { response, token },
    },
    user: { id: userId },
  } = ctx;

  const invite = await OrganizationInvite.findOne({ where: { key: token } });

  if (!invite) {
    throw notFound('This token is invalid.');
  }

  const organization = await Organization.findByPk(invite.OrganizationId);

  if (organizationId !== organization.id) {
    throw notAcceptable('Organization IDs does not match');
  }

  if (response) {
    await organization.$add('User', userId);
  }

  await invite.destroy();
}

export async function inviteMember(ctx: KoaContext<Params>): Promise<void> {
  const {
    argv: { host },
    mailer,
    params: { organizationId },
    request: {
      body: { email },
    },
    user,
  } = ctx;

  const organization = await Organization.findByPk(organizationId, { include: [User] });
  if (!organization) {
    throw notFound('Organization not found.');
  }

  const dbEmail = await EmailAuthorization.findByPk(email, { include: [User] });
  const invitedUser = dbEmail ? dbEmail.User : null;

  if (!(await organization.$has('User', user.id))) {
    throw forbidden('Not allowed to invite users to organizations you are not a member of.');
  }

  await checkRole(ctx, organization.id, Permission.InviteMember);

  if (invitedUser && (await organization.$has('User', invitedUser))) {
    throw conflict('User is already in this organization or has already been invited.');
  }

  const key = randomBytes(20).toString('hex');
  await OrganizationInvite.create({
    OrganizationId: organization.id,
    UserId: invitedUser ? invitedUser.id : null,
    key,
    email,
  });

  await mailer.sendTemplateEmail(
    { email, ...(invitedUser && { name: invitedUser.name }) },
    'organizationInvite',
    {
      organization: organization.id,
      url: `${host}/organization-invite?token=${key}`,
    },
  );

  ctx.body = {
    id: invitedUser ? invitedUser.id : null,
    name: invitedUser ? invitedUser.name : null,
    primaryEmail: invitedUser ? invitedUser.primaryEmail : email,
  };
}

export async function resendInvitation(ctx: KoaContext<Params>): Promise<void> {
  const {
    argv: { host },
    mailer,
    params: { organizationId },
    request: {
      body: { email },
    },
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    include: [OrganizationInvite],
  });
  if (!organization) {
    throw notFound('Organization not found.');
  }

  await checkRole(ctx, organization.id, Permission.InviteMember);

  const invite = await organization.OrganizationInvites.find((i) => i.email === email);
  if (!invite) {
    throw notFound('This person was not invited previously.');
  }

  const user = await User.findByPk(invite.UserId);

  await mailer.sendTemplateEmail(
    { email, ...(user && { name: user.name }) },
    'organizationInvite',
    {
      organization: organization.id,
      url: `${host}/organization-invite?token=${invite.key}`,
    },
  );

  ctx.body = 204;
}

export async function removeInvite(ctx: KoaContext): Promise<void> {
  const {
    request: {
      body: { email },
    },
  } = ctx;

  const invite = await OrganizationInvite.findOne({ where: { email } });
  if (!invite) {
    throw notFound('This invite does not exist.');
  }

  await checkRole(ctx, invite.OrganizationId, Permission.InviteMember);

  await invite.destroy();
}

export async function removeMember(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { memberId, organizationId },
    user,
  } = ctx;

  const organization = await Organization.findByPk(organizationId, { include: [User] });
  if (!organization.Users.some((u) => u.id === user.id)) {
    throw notFound('User is not part of this organization.');
  }

  if (!organization.Users.some((u) => u.id === memberId)) {
    throw notFound('This member is not part of this organization.');
  }

  if (memberId !== user.id) {
    await checkRole(ctx, organization.id, Permission.ManageMembers);
  }

  if (memberId === user.id && organization.Users.length <= 1) {
    throw notAcceptable(
      'Not allowed to remove yourself from an organization if you’re the only member left.',
    );
  }

  await organization.$remove('User', memberId);
}

export async function setRole(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { memberId, organizationId },
    request: {
      body: { role },
    },
    user,
  } = ctx;

  const organization = await Organization.findByPk(organizationId, { include: [User] });
  if (!organization.Users.some((u) => u.id === user.id)) {
    throw notFound('User is not part of this organization.');
  }

  if (user.id === memberId) {
    throw badRequest('Not allowed to change your own rule.');
  }

  await checkRole(ctx, organization.id, Permission.ManageRoles);

  const member = organization.Users.find((m) => m.id === memberId);
  if (!member) {
    throw notFound('This member is not part of this organization.');
  }

  await member.Member.update({ role });
  ctx.body = {
    id: member.id,
    role,
    name: member.name,
    primaryEmail: member.primaryEmail,
  };
}
