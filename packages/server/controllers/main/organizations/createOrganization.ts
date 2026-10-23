import { assertKoaCondition, organizationBlocklist, uploadToBuffer } from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import {
  EmailAuthorization,
  Organization,
  OrganizationMember,
  transactional,
  User,
} from '../../../models/index.js';

export async function createOrganization(ctx: Context): Promise<void> {
  const {
    request: {
      body: {
        city,
        countryCode,
        description,
        email,
        houseNumber,
        icon,
        id,
        invoiceReference,
        locale,
        name,
        streetName,
        vatIdNumber,
        website,
        zipCode,
      },
    },
    user: authSubject,
  } = ctx;

  const user = (await User.findByPk(authSubject!.id, {
    attributes: ['id', 'primaryEmail', 'name'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
  }))!;

  const userEmailAuthorization = await EmailAuthorization.findOne({
    attributes: ['verified'],
    where: {
      email: user.primaryEmail,
    },
  });

  assertKoaCondition(
    user.primaryEmail != null && userEmailAuthorization != null && userEmailAuthorization.verified,
    ctx,
    403,
    'Email not verified.',
  );

  assertKoaCondition(
    !organizationBlocklist.includes(id),
    ctx,
    400,
    'This organization id is not allowed.',
  );

  assertKoaCondition(
    (await Organization.count({ where: { id }, paranoid: false })) === 0,
    ctx,
    409,
    `Another organization with the id “${id}” already exists`,
  );

  const organization = await transactional(async (transaction) => {
    const created = await Organization.create(
      {
        id,
        name,
        email,
        description,
        locale,
        website,
        icon: icon ? await uploadToBuffer(icon.path) : null,
        vatIdNumber,
        city,
        countryCode,
        houseNumber,
        streetName,
        zipCode,
        invoiceReference,
      },
      { transaction },
    );

    await OrganizationMember.create(
      {
        OrganizationId: created.id,
        UserId: user.id,
        role: PredefinedOrganizationRole.Owner,
      },
      { transaction },
    );
    return created;
  });

  ctx.body = {
    id: organization.id,
    name: organization.name,
    iconUrl: icon
      ? `/api/organizations/${organization.id}/icon?updated=${organization.created.toISOString()}`
      : null,
    description: organization.description,
    website: organization.website,
    locale: organization.locale,
    email: organization.email,
    members: [
      {
        id: user.id,
        name: user.name,
        primaryEmail: user.primaryEmail,
        role: PredefinedOrganizationRole.Owner,
      },
    ],
    invites: [],
    vatIdNumber: organization.vatIdNumber,
    streetName: organization.streetName,
    houseNumber: organization.houseNumber,
    city: organization.city,
    zipCode: organization.zipCode,
    countryCode: organization.countryCode,
    invoiceReference: organization.invoiceReference,
  };
}
