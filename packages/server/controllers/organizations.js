import validateStyle, { StyleValidationError } from '@appsemble/utils/validateStyle';
import Boom from 'boom';

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

export async function inviteMember(ctx) {
  const { organizationId } = ctx.params;
  const { email } = ctx.request.body;
  const { Organization, EmailAuthorization, User } = ctx.db.models;

  const dbEmail = await EmailAuthorization.findByPk(email, { include: [User] });

  if (!dbEmail) {
    throw Boom.notFound('No member with this email address could be found.');
  }

  const organization = await Organization.findByPk(organizationId);
  const user = dbEmail.User;

  if (await organization.hasUser(user)) {
    throw Boom.conflict('User is already in this organization.');
  }

  await organization.addUser(user);
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

  if (memberId === user.id) {
    throw Boom.notAcceptable('Not allowed to remove yourself from an organization');
  }

  const organization = await Organization.findByPk(organizationId, { include: [User] });
  if (!organization.Users.some(u => u.id === memberId)) {
    throw Boom.notFound('User is not part of this organization');
  }

  await organization.removeUser(memberId);

  ctx.status = 204;
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
