import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppCollection, Organization } from '../../../../models/index.js';
import { getOrganizationMemberAccess } from '../../../../utils/organizationSso.js';

export async function queryOrganizationAppCollections(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const organization = await Organization.findByPk(organizationId, { attributes: ['id'] });

  assertKoaCondition(organization != null, ctx, 404, 'Organization not found.');

  const organizationMember = await getOrganizationMemberAccess(ctx, organizationId);

  const collections = await AppCollection.findAll({
    include: [
      {
        model: Organization,
        attributes: ['name'],
      },
    ],
    where: {
      OrganizationId: organizationId,
      ...(organizationMember ? {} : { visibility: 'public' }),
    },
    order: [['updated', 'DESC']],
  });

  ctx.response.status = 200;
  ctx.response.body = collections.map((collection) => collection.toJSON());
}
