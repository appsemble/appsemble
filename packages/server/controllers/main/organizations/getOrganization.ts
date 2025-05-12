import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { literal } from 'sequelize';

import { Organization } from '../../../models/index.js';

export async function getOrganization(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    attributes: {
      include: [[literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      exclude: ['icon'],
    },
  });

  assertKoaCondition(organization != null, ctx, 404, 'Organization not found.');

  ctx.body = {
    id: organization.id,
    name: organization.name,
    description: organization.description,
    website: organization.website,
    email: organization.email,
    iconUrl: organization.get('hasIcon')
      ? `/api/organizations/${organization.id}/icon?updated=${organization.updated.toISOString()}`
      : null,
    preferredPaymentProvider: organization.preferredPaymentProvider,
    vatIdNumber: organization.vatIdNumber,
    streetName: organization.streetName,
    houseNumber: organization.houseNumber,
    city: organization.city,
    zipCode: organization.zipCode,
    countryCode: organization.countryCode,
    invoiceReference: organization.invoiceReference,
  };
}
