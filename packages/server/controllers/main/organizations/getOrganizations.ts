import { type Context } from 'koa';
import { literal, Op } from 'sequelize';

import { Organization } from '../../../models/index.js';

export async function getOrganizations(ctx: Context): Promise<void> {
  const organizations = await Organization.findAll({
    attributes: [
      'id',
      'name',
      'description',
      'website',
      'email',
      'locale',
      'updated',
      'vatIdNumber',
      'streetName',
      'houseNumber',
      'city',
      'zipCode',
      'countryCode',
      'invoiceReference',
      [literal('"Organization"."icon" IS NOT NULL'), 'hasIcon'],
    ],
    where: {
      [Op.or]: [
        literal(`EXISTS (
          SELECT 1
          FROM "App"
          WHERE "App"."OrganizationId" = "Organization"."id"
            AND "App"."visibility" = 'public'
            AND "App"."deleted" IS NULL
        )`),
        literal(`EXISTS (
          SELECT 1
          FROM "BlockVersion"
          WHERE "BlockVersion"."OrganizationId" = "Organization"."id"
            AND "BlockVersion"."visibility" = 'public'
        )`),
      ],
    },
    order: [['id', 'ASC']],
  });

  ctx.body = organizations.map((organization) => ({
    id: organization.id,
    name: organization.name,
    description: organization.description,
    website: organization.website,
    email: organization.email,
    locale: organization.locale,
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
  }));
}
