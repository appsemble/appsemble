import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppCollection, BlockVersion, Organization } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function deleteOrganization(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [
      OrganizationPermission.DeleteOrganizations,
      OrganizationPermission.DeleteApps,
    ],
  });

  const organization = await Organization.findByPk(organizationId);

  assertKoaCondition(organization != null, ctx, 404, 'Organization not found.');

  await organization.reload({
    include: [BlockVersion, AppCollection, App],
  });

  assertKoaCondition(
    organization.BlockVersions.length === 0,
    ctx,
    403,
    'Cannot delete an organization with associated blocks.',
  );

  assertKoaCondition(
    organization.AppCollections.length === 0,
    ctx,
    403,
    'Cannot delete an organization with associated app collections.',
  );

  organization.Apps.map(async (app) => {
    await app.destroy();
  });

  await organization.destroy();

  ctx.body = {
    id: organization.id,
  };
}
