import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { AppCollection, Organization, OrganizationMember } from '../../../../models/index.js';

export async function queryOrganizationAppCollections(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    user: authSubject,
  } = ctx;

  const organization = await Organization.findByPk(organizationId, { attributes: ['id'] });

  assertKoaCondition(organization != null, ctx, 404, 'Organization not found.');

  let organizationMember;
  if (authSubject) {
    organizationMember = await OrganizationMember.findOne({
      where: {
        UserId: authSubject!.id,
        OrganizationId: organizationId,
      },
    });
  }

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
