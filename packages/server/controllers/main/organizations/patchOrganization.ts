import { assertKoaCondition, uploadToBuffer } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { Organization } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function patchOrganization(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    request: {
      body: { description, email, icon, name, website },
    },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.UpdateOrganizations],
  });

  const organization = await Organization.findByPk(organizationId);

  assertKoaCondition(organization != null, ctx, 404, 'Organization not found');

  const result: Partial<Organization> = {};
  if (name !== undefined) {
    result.name = name || null;
  }

  if (icon !== undefined) {
    result.icon = icon ? await uploadToBuffer(icon.path) : null;
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
