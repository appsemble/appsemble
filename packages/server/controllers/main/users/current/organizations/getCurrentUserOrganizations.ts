import { type Context } from 'koa';
import { literal } from 'sequelize';

import { Organization, User } from '../../../../../models/index.js';

export async function getCurrentUserOrganizations(ctx: Context): Promise<void> {
  const user = ctx.user!;

  const organizations = await Organization.findAll({
    attributes: [
      'id',
      'name',
      'description',
      'website',
      'email',
      'updated',
      'preferredPaymentProvider',
      'vatIdNumber',
      'streetName',
      'houseNumber',
      'city',
      'zipCode',
      'countryCode',
      'invoiceReference',
      [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
    ],
    include: [{ model: User, where: { id: user.id } }],
  });

  ctx.body = organizations.map((org: Organization) => ({
    id: org.id,
    name: org.name,
    role: org.Users[0].OrganizationMember!.role,
    description: org.description,
    website: org.website,
    email: org.email,
    iconUrl: org.get('hasIcon')
      ? `/api/organizations/${org.id}/icon?updated=${org.updated.toISOString()}`
      : null,
    preferredPaymentProvider: org.preferredPaymentProvider,
    vatIdNumber: org.vatIdNumber,
    streetName: org.streetName,
    houseNumber: org.houseNumber,
    city: org.city,
    zipCode: org.zipCode,
    countryCode: org.countryCode,
    invoiceReference: org.invoiceReference,
  }));
}
