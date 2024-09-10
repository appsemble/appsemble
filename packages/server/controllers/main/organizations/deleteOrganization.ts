import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppCollection, BlockVersion, Organization } from '../../../models/index.js';
import { checkRole } from '../../../utils/checkRole.js';

export async function deleteOrganization(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const member = await checkRole(ctx, organizationId, Permission.DeleteOrganization, {
    include: { model: Organization },
  });
  const organization = member.Organization;
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
