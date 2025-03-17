import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { literal } from 'sequelize';

import { Organization, OrganizationInvite } from '../../../../models/index.js';

export async function getOrganizationInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { token },
  } = ctx;

  const invite = await OrganizationInvite.findOne({
    where: { key: token },
    include: {
      model: Organization,
      attributes: {
        include: [[literal('icon IS NOT NULL'), 'hasIcon']],
        exclude: ['icon'],
      },
    },
  });

  assertKoaCondition(!!invite, ctx, 404, 'This token does not exist');
  assertKoaCondition(!!invite.organization, ctx, 404, 'Organization not found');

  ctx.body = {
    id: invite.organization.id,
    name: invite.organization.name,
    iconUrl: invite.organization.get('hasIcon')
      ? `/api/organizations/${
          invite.organization.id
        }/icon?updated=${invite.organization.updated.toISOString()}`
      : null,
  };
}
