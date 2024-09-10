import { type Context } from 'koa';

import { AppCollection, Organization, OrganizationMember } from '../../../../models/index.js';

export async function queryOrganizationAppCollections(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const isUserMember =
    (await OrganizationMember.count({
      where: {
        UserId: ctx.user?.id ?? null,
        OrganizationId: organizationId,
      },
    })) > 0;
  const collections = await AppCollection.findAll({
    include: [
      {
        model: Organization,
      },
    ],
    where: {
      OrganizationId: organizationId,
      ...(isUserMember ? {} : { visibility: 'public' }),
    },
    order: [['updated', 'DESC']],
  });

  ctx.response.status = 200;
  ctx.response.body = collections.map((collection) => collection.toJSON());
}
