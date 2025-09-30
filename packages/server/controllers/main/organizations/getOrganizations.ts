import { type Context } from 'koa';
import { literal } from 'sequelize';

import { App, BlockVersion, Organization } from '../../../models/index.js';

export async function getOrganizations(ctx: Context): Promise<void> {
  const organizations = await Organization.findAll({
    order: [['id', 'ASC']],
    include: [
      { model: App, required: false, where: { visibility: 'public' }, attributes: ['id'] },
      { model: BlockVersion, required: false, where: { visibility: 'public' }, attributes: ['id'] },
    ],
    attributes: {
      include: [[literal('"Organization".icon IS NOT NULL'), 'hasIcon']],
      exclude: ['icon'],
    },
  });

  ctx.body = organizations
    .filter((organization) => organization.Apps.length || organization.BlockVersions.length)
    .map((organization) => ({
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
    }));
}
