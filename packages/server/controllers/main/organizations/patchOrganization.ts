import { assertKoaCondition, uploadToBuffer } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { Organization } from '../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../utils/authorization.js';

export async function patchOrganization(ctx: Context): Promise<void> {
  const {
    pathParams: { organizationId },
    request: {
      body: {
        city,
        countryCode,
        description,
        email,
        houseNumber,
        icon,
        invoiceReference,
        name,
        preferredPaymentProvider,
        streetName,
        vatIdNumber,
        website,
        zipCode,
      },
    },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.UpdateOrganizations],
  });

  const organization = await Organization.findByPk(organizationId);

  assertKoaCondition(organization != null, ctx, 404, 'Organization not found');

  const result: Partial<Organization> = {};
  if (name !== undefined) {
    result.name = name || null;
  }

  if (icon !== undefined) {
    result.icon = icon ? await uploadToBuffer(icon.path) : undefined;
  }

  if (description !== undefined) {
    result.description = description || null;
  }

  if (email !== undefined) {
    result.email = email || null;
  }

  if (website !== undefined) {
    result.website = website || null;
  }

  if (preferredPaymentProvider !== undefined) {
    result.preferredPaymentProvider = preferredPaymentProvider || null;
  }

  if (countryCode !== undefined) {
    result.countryCode = countryCode || null;
    result.vatIdNumber = undefined;
  }

  if (vatIdNumber !== undefined) {
    result.vatIdNumber = vatIdNumber || null;
  }

  if (streetName !== undefined) {
    result.streetName = streetName || null;
  }

  if (houseNumber !== undefined) {
    result.houseNumber = houseNumber || null;
  }

  if (city !== undefined) {
    result.city = city || null;
  }

  if (zipCode !== undefined) {
    result.zipCode = zipCode || null;
  }

  if (invoiceReference !== undefined) {
    result.invoiceReference = invoiceReference || null;
  }

  const updated = await organization.update(result);

  ctx.body = {
    id: organization.id,
    name: updated.name,
    description: updated.description,
    website: updated.website,
    email: updated.name,
    iconUrl: updated.icon
      ? `/api/organizations/${organization.id}/icon?updated=${updated.updated.toISOString()}`
      : null,
    preferredPaymentProvider: updated.preferredPaymentProvider,
    vatIdNumber: updated.vatIdNumber,
    streetName: updated.streetName,
    houseNumber: updated.houseNumber,
    city: updated.city,
    zipCode: updated.zipCode,
    countryCode: updated.countryCode,
    invoiceReference: updated.invoiceReference,
  };
}
