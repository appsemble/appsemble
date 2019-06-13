import validateStyle, { StyleValidationError } from '@appsemble/utils/validateStyle';
import Boom from 'boom';
import { UniqueConstraintError } from 'sequelize';

import { sendOrganizationInviteEmail } from '../utils/email';

export async function getOrganization(ctx) {
  const { organizationId } = ctx.params;
  const { Organization, User } = ctx.db.models;

  const organization = await Organization.findByPk(organizationId, {
    include: [User],
  });
  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = {
    id: organization.id,
    members: organization.Users.map(user => ({
      id: user.id,
      name: user.name,
      primaryEmail: user.primaryEmail,
    })),
  };
}

export async function createOrganization(ctx) {
  const { name } = ctx.request.body;
  const { Organization, User } = ctx.db.models;
  const {
    user: { id: userId },
  } = ctx.state;

  try {
    const organization = await Organization.create({ id: name }, { include: [User] });
    await organization.addUser(userId);

    await organization.reload();

    ctx.status = 201;
    ctx.body = {
      id: organization.id,
      members: organization.Users.map(u => ({
        id: u.id,
        name: u.name,
        primaryEmail: u.primaryEmail,
      })),
    };
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw Boom.conflict(`Another organization with the name “${name}” already exists`);
    }

    throw error;
  }
}

export async function inviteMember(ctx) {
  const { organizationId } = ctx.params;
  const { email } = ctx.request.body;
  const { Organization, EmailAuthorization, User } = ctx.db.models;

  const dbEmail = await EmailAuthorization.findByPk(email, { include: [User] });

  if (!dbEmail) {
    throw Boom.notFound('No member with this email address could be found.');
  }

  if (dbEmail && !dbEmail.verified) {
    throw Boom.notAcceptable('This email address has not been verified.');
  }

  const organization = await Organization.findByPk(organizationId);
  const user = dbEmail.User;

  if (await organization.hasUser(user)) {
    throw Boom.conflict('User is already in this organization.');
  }

  await organization.addUser(user);
  await sendOrganizationInviteEmail(
    { email, name: user.name, organization: organization.id },
    ctx.state.smtp,
  );

  ctx.body = {
    id: user.id,
    name: user.name,
    primaryEmail: user.primaryEmail,
  };
  ctx.status = 201;
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

  ctx.status = 204;
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

    ctx.status = 204;
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

    ctx.status = 204;
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

    ctx.status = 204;
  } catch (e) {
    if (e instanceof StyleValidationError) {
      throw Boom.badRequest('Provided CSS was invalid.');
    }

    throw e;
  }
}
