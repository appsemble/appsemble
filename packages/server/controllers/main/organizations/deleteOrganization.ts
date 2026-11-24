import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import {
  App,
  AppCollection,
  BlockVersion,
  Organization,
  transactional,
} from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';
import { revokeServiceAccounts } from '../../../utils/serviceAccounts.js';

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
    include: [BlockVersion, AppCollection],
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

  await transactional(async (transaction) => {
    await App.destroy({
      individualHooks: true,
      where: { OrganizationId: organizationId },
      transaction,
    });
    await revokeServiceAccounts({ OrganizationId: organizationId }, transaction);
    await organization.destroy({ transaction });
  });

  ctx.body = {
    id: organization.id,
  };
}
