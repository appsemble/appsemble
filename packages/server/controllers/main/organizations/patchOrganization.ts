import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { Organization } from '../../../models/index.js';
import { checkRole } from '../../../utils/checkRole.js';

export async function patchOrganization(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    request: {
      body: { description, email, icon, name, website },
    },
  } = ctx;

  const member = await checkRole(ctx, organizationId, Permission.EditOrganization, {
    include: { model: Organization },
  });
  const organization = member.Organization;
  assertKoaError(!organization, ctx, 404, 'Organization not found');

  const result: Partial<Organization> = {};
  if (name !== undefined) {
    result.name = name || null;
  }

  if (icon !== undefined) {
    result.icon = icon ? icon.contents : null;
  }

  if (description !== undefined) {
    result.description = description || null;
  }

  if (email !== undefined) {
    result.email = email || null;
  }

  if (website !== undefined) {
    result.website = website || null;
  }

  const updated = await organization.update(result);

  ctx.body = {
    id: organization.id,
    name: updated.name,
    description: updated.description,
    website: updated.website,
    email: updated.name,
    iconUrl: updated.icon
      ? `/api/organizations/${organization.id}/icon?updated=${updated.updated.toISOString()}`
      : null,
  };
}
