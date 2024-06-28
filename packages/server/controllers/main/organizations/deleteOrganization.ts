import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppCollection, BlockVersion, Organization } from '../../../models/index.js';
import { checkUserPermissions } from '../../../utils/authorization.js';

export async function deleteOrganization(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  await checkUserPermissions(ctx, organizationId, [
    MainPermission.DeleteOrganizations,
    MainPermission.DeleteApps,
  ]);

  const organization = await Organization.findByPk(organizationId);

  assertKoaError(!organization, ctx, 404, 'Organization not found.');

  await organization.reload({
    include: [BlockVersion, AppCollection, App],
  });

  assertKoaError(
    organization.BlockVersions.length !== 0,
    ctx,
    403,
    'Cannot delete an organization with associated blocks.',
  );

  assertKoaError(
    organization.AppCollections.length !== 0,
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
