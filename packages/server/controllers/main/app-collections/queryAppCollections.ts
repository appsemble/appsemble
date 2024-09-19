import { type Context } from 'koa';
import { Op } from 'sequelize';

import { AppCollection, Organization, OrganizationMember } from '../../../models/index.js';

export async function queryAppCollections(ctx: Context): Promise<void> {
  const memberships = await OrganizationMember.findAll({
    where: {
      UserId: ctx.user?.id ?? null,
    },
    attributes: ['OrganizationId'],
  });
  const collections = await AppCollection.findAll({
    include: [
      {
        model: Organization,
        attributes: ['name'],
      },
    ],
    where: {
      [Op.or]: [
        {
          visibility: 'public',
        },
        {
          OrganizationId: {
            [Op.in]: memberships.map((membership) => membership.OrganizationId),
          },
        },
      ],
    },
    order: [['updated', 'DESC']],
  });

  ctx.response.status = 200;
  ctx.response.body = collections.map((collection) => collection.toJSON());
}
