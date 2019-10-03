import { StyleValidationError, validateStyle } from '@appsemble/utils';
import Boom from '@hapi/boom';
import crypto from 'crypto';
import { UniqueConstraintError } from 'sequelize';

export async function getOrganization(ctx) {
  const { organizationId } = ctx.params;
  const { Organization, OrganizationInvite, User } = ctx.db.models;

  const organization = await Organization.findByPk(organizationId, {
    include: [User, OrganizationInvite],
  });
  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = {
    id: organization.id,
    name: organization.name,
    members: organization.Users.map(user => ({
      id: user.id,
      name: user.name,
      primaryEmail: user.primaryEmail,
    })),
    invites: organization.OrganizationInvites.map(invite => ({
      email: invite.email,
    })),
  };
}

export async function createOrganization(ctx) {
  const { id, name } = ctx.request.body;
  const { Organization, User } = ctx.db.models;
  const {
    user: { id: userId },
  } = ctx.state;

  try {
    const organization = await Organization.create({ id, name }, { include: [User] });

    await organization.addUser(userId);
    await organization.reload();

    ctx.body = {
      id: organization.id,
      name: organization.name,
      members: organization.Users.map(u => ({
        id: u.id,
        name: u.name,
        primaryEmail: u.primaryEmail,
      })),
      invites: [],
    };
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw Boom.conflict(`Another organization with the name “${name}” already exists`);
    }

    throw error;
  }
}

export async function getInvitation(ctx) {
  const { token } = ctx.params;
  const { Organization, OrganizationInvite } = ctx.db.models;

  const invite = await OrganizationInvite.findOne(
    {
      where: { key: token },
    },
    { raw: true },
  );

  if (!invite) {
    throw Boom.notFound('This token does not exist.');
  }

  const organization = await Organization.findByPk(invite.OrganizationId, { raw: true });

  ctx.body = { organization: { id: organization.id, name: organization.name } };
}

export async function respondInvitation(ctx) {
  const { organizationId } = ctx.params;
  const { response, token } = ctx.request.body;
  const { OrganizationInvite, Organization } = ctx.db.models;
  const {
    user: { id: userId },
  } = ctx.state;

  const invite = await OrganizationInvite.findOne({ where: { key: token } });

  if (!invite) {
    throw Boom.notFound('This token is invalid.');
  }

  const organization = await Organization.findByPk(invite.OrganizationId);

  if (organizationId !== organization.id) {
    throw Boom.notAcceptable('Organization IDs does not match');
  }

  if (response) {
    await organization.addUser(userId);
  }

  await invite.destroy();
}

export async function inviteMember(ctx) {
  const { mailer } = ctx;
  const { organizationId } = ctx.params;
  const { email } = ctx.request.body;
  const { Organization, EmailAuthorization, OrganizationInvite, User } = ctx.db.models;
  const { user } = ctx.state;

  const organization = await Organization.findByPk(organizationId, { include: [User] });
  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  const dbEmail = await EmailAuthorization.findByPk(email, { include: [User] });
  const invitedUser = dbEmail ? dbEmail.User : null;

  if (!(await organization.hasUser(Number(user.id)))) {
    throw Boom.forbidden('Not allowed to invite users to organizations you are not a member of.');
  }

  if (invitedUser && (await organization.hasUser(invitedUser))) {
    throw Boom.conflict('User is already in this organization or has already been invited.');
  }

  const key = crypto.randomBytes(20).toString('hex');
  await OrganizationInvite.create({
    OrganizationId: organization.id,
    UserId: invitedUser ? invitedUser.id : null,
    key,
    email,
  });

  await mailer.sendEmail(
    { email, ...(invitedUser && { name: invitedUser.name }) },
    'organizationInvite',
    {
      organization: organization.id,
      url: `${ctx.origin}/organization-invite?token=${key}`,
    },
  );

  ctx.body = {
    id: invitedUser ? invitedUser.id : null,
    name: invitedUser ? invitedUser.name : null,
    primaryEmail: invitedUser ? invitedUser.primaryEmail : email,
  };
}

export async function resendInvitation(ctx) {
  const { mailer } = ctx;
  const { organizationId } = ctx.params;
  const { email } = ctx.request.body;
  const { Organization, OrganizationInvite } = ctx.db.models;

  const organization = await Organization.findByPk(organizationId, {
    include: [OrganizationInvite],
  });
  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  const invite = await organization.OrganizationInvites.find(i => i.email === email);
  if (!invite) {
    throw Boom.notFound('This person was not invited previously.');
  }

  const user = await invite.getUser();

  await mailer.sendEmail({ email, ...(user && { name: user.name }) }, 'organizationInvite', {
    organization: organization.id,
    url: `${ctx.origin}/organization-invite?token=${invite.key}`,
  });

  ctx.body = 204;
}

export async function removeMember(ctx) {
  const { organizationId, memberId } = ctx.params;
  const { Organization, User } = ctx.db.models;
  const { user } = ctx.state;

  const organization = await Organization.findByPk(organizationId, { include: [User] });
  if (!organization.Users.some(u => u.id === memberId)) {
    throw Boom.notFound('User is not part of this organization');
  }

  if (Number(memberId) === Number(user.id) && organization.Users.length <= 1) {
    throw Boom.notAcceptable(
      "Not allowed to remove yourself from an organization if you're the only member left.",
    );
  }

  await organization.removeUser(memberId);
}

export async function removeInvite(ctx) {
  const { email } = ctx.request.body;
  const { OrganizationInvite } = ctx.db.models;
  const { user } = ctx.state;

  const invite = await OrganizationInvite.findOne({ where: { email } });
  if (!invite) {
    throw Boom.notFound('This invite does not exist.');
  }

  const organization = await invite.getOrganization();
  if (!organization.hasUser(user.id)) {
    throw Boom.forbidden(
      "Not allowed to revoke an invitation if you're not part of the organization.",
    );
  }

  await invite.destroy();
}

export async function getOrganizationCoreStyle(ctx) {
  const { organizationId } = ctx.params;
  const { Organization } = ctx.db.models;
  const organization = await Organization.findByPk(organizationId, { raw: true });

  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = organization.coreStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setOrganizationCoreStyle(ctx) {
  const { organizationId } = ctx.params;
  const { db } = ctx;
  const { Organization } = db.models;
  const { style } = ctx.request.body;
  const css = style.toString().trim();

  try {
    validateStyle(css);

    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      throw Boom.notFound('Organization not found.');
    }

    organization.coreStyle = css.length ? css.toString() : null;
    await organization.save();
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}

export async function getOrganizationSharedStyle(ctx) {
  const { organizationId } = ctx.params;
  const { Organization } = ctx.db.models;
  const organization = await Organization.findByPk(organizationId, { raw: true });

  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = organization.sharedStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setOrganizationSharedStyle(ctx) {
  const { organizationId } = ctx.params;
  const { db } = ctx;
  const { Organization } = db.models;
  const { style } = ctx.request.body;
  const css = style.toString().trim();

  try {
    validateStyle(css);

    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      throw Boom.notFound('Organization not found.');
    }

    organization.sharedStyle = css.length ? css.toString() : null;
    await organization.save();
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}

export async function getOrganizationBlockStyle(ctx) {
  const { organizationId, blockOrganizationId, blockId } = ctx.params;
  const { OrganizationBlockStyle } = ctx.db.models;

  const blockStyle = await OrganizationBlockStyle.findOne({
    where: {
      OrganizationId: organizationId,
      BlockDefinitionId: `@${blockOrganizationId}/${blockId}`,
    },
  });

  ctx.body = blockStyle && blockStyle.style ? blockStyle.style : '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setOrganizationBlockStyle(ctx) {
  const { organizationId, blockOrganizationId, blockId } = ctx.params;
  const { db } = ctx;
  const { Organization, OrganizationBlockStyle, BlockDefinition } = db.models;
  const { style } = ctx.request.body;
  const css = style.toString().trim();

  try {
    validateStyle(css);

    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      throw Boom.notFound('Organization not found.');
    }

    const block = await BlockDefinition.findByPk(`@${blockOrganizationId}/${blockId}`);
    if (!block) {
      throw Boom.notFound('Block not found.');
    }

    await OrganizationBlockStyle.upsert({
      style: css.length ? css.toString() : null,
      OrganizationId: organization.id,
      BlockDefinitionId: block.id,
    });
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}
