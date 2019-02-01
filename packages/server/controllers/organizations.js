import Boom from 'boom';
import validateStyle, { StyleValidationError } from '@appsemble/utils/validateStyle';

export async function getOrganizationCoreStyle(ctx) {
  const { id } = ctx.params;
  const { Organization } = ctx.db.models;
  const organization = await Organization.findByPk(id, { raw: true });

  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = organization.coreStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setOrganizationCoreStyle(ctx) {
  const { id } = ctx.params;
  const { db } = ctx;
  const { Organization } = db.models;
  const { style } = ctx.request.body;
  const css = style.toString().trim();

  try {
    validateStyle(css);

    const organization = await Organization.findByPk(id);
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
  const { id } = ctx.params;
  const { Organization } = ctx.db.models;
  const organization = await Organization.findByPk(id, { raw: true });

  if (!organization) {
    throw Boom.notFound('Organization not found.');
  }

  ctx.body = organization.sharedStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setOrganizationSharedStyle(ctx) {
  const { id } = ctx.params;
  const { db } = ctx;
  const { Organization } = db.models;
  const { style } = ctx.request.body;
  const css = style.toString().trim();

  try {
    validateStyle(css);

    const organization = await Organization.findByPk(id);
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
  const { organizationId, organizationName, blockName } = ctx.params;
  const { OrganizationBlockStyle } = ctx.db.models;

  const blockId = `${organizationName}/${blockName}`;
  const blockStyle = await OrganizationBlockStyle.findOne({
    where: {
      OrganizationId: organizationId,
      BlockDefinitionId: blockId,
    },
  });

  ctx.body = blockStyle && blockStyle.style ? blockStyle.style : '';
  ctx.type = 'css';
  ctx.status = 200;
}

export async function setOrganizationBlockStyle(ctx) {
  const { organizationId, organizationName, blockName } = ctx.params;
  const { db } = ctx;
  const { Organization, OrganizationBlockStyle, BlockDefinition } = db.models;
  const { style } = ctx.request.body;
  const css = style.toString().trim();

  const blockId = `${organizationName}/${blockName}`;

  try {
    validateStyle(css);

    const organization = await Organization.findByPk(organizationId);
    if (!organization) {
      throw Boom.notFound('Organization not found.');
    }

    const block = await BlockDefinition.findByPk(blockId);
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
