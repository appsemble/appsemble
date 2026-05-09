import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { literal } from 'sequelize';

import { App, BlockVersion, Organization } from '../../../models/index.js';

export async function getOrganization(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    user: authSubject,
  } = ctx;

  const organization = await Organization.findByPk(organizationId, {
    include: [
      { model: App, required: false, where: { visibility: 'public' }, attributes: ['id'] },
      { model: BlockVersion, required: false, where: { visibility: 'public' }, attributes: ['id'] },
    ],
    attributes: {
      include: [[literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      exclude: ['icon'],
    },
  });

  assertKoaCondition(
    organization != null &&
      (Boolean(authSubject) ||
        organization.Apps.length > 0 ||
        organization.BlockVersions.length > 0),
    ctx,
    404,
    'Organization not found.',
  );

  ctx.body = {
    id: organization.id,
    name: organization.name,
    description: organization.description,
    website: organization.website,
    locale: organization.locale,
    email: organization.email,
    iconUrl: organization.get('hasIcon')
      ? `/api/organizations/${organization.id}/icon?updated=${organization.updated.toISOString()}`
      : null,
    vatIdNumber: organization.vatIdNumber,
    streetName: organization.streetName,
    houseNumber: organization.houseNumber,
    city: organization.city,
    zipCode: organization.zipCode,
    countryCode: organization.countryCode,
    invoiceReference: organization.invoiceReference,
  };
}
