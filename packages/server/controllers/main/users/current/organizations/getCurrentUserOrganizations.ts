import { OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import { type Context } from 'koa';
import { literal } from 'sequelize';

import { Organization, User } from '../../../../../models/index.js';
import {
  getOrganizationMemberAccess,
  getOrganizationMemberRoles,
} from '../../../../../utils/organizationSso.js';

export async function getCurrentUserOrganizations(ctx: Context): Promise<void> {
  const user = ctx.user!;

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
      [literal('"Organization".icon IS NOT NULL'), 'hasIcon'],
    ],
    include: [{ model: User, where: { id: user.id } }],
  });

  ctx.body = (
    await Promise.all(
      organizations.map(async (org: Organization) => {
        const member = await getOrganizationMemberAccess(ctx, org.id);
        if (!member) {
          return null;
        }
        const roles = getOrganizationMemberRoles(member);
        return {
          id: org.id,
          name: org.name,
          role: member.role,
          roles,
          ssoRoles: member.ssoRoles,
          guest: member.guest,
          description: org.description,
          website: org.website,
          email: org.email,
          locale: org.locale,
          iconUrl: org.get('hasIcon')
            ? `/api/organizations/${org.id}/icon?updated=${org.updated.toISOString()}`
            : null,
          ...(checkOrganizationRoleOrganizationPermissions(roles, [
            OrganizationPermission.ManageOrganizationSubscriptions,
          ])
            ? {
                vatIdNumber: org.vatIdNumber,
                streetName: org.streetName,
                houseNumber: org.houseNumber,
                city: org.city,
                zipCode: org.zipCode,
                countryCode: org.countryCode,
                invoiceReference: org.invoiceReference,
              }
            : {}),
        };
      }),
    )
  ).filter(Boolean);
}
