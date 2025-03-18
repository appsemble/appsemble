import {
  assertKoaCondition,
  organizationBlocklist,
  throwKoaError,
  uploadToBuffer,
} from '@appsemble/node-utils';
import { PredefinedOrganizationRole } from '@appsemble/types';
import { type Context } from 'koa';
import { Op, UniqueConstraintError } from 'sequelize';

import {
  EmailAuthorization,
  Organization,
  OrganizationMember,
  User,
} from '../../../models/index.js';

export async function createOrganization(ctx: Context): Promise<void> {
  const {
    request: {
      body: { description, email, icon, id, name, website },
    },
    user: authSubject,
  } = ctx;

  const user = await User.findByPk(authSubject.id, {
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
  });

  const userEmailAuthorization = await EmailAuthorization.findOne({
    attributes: ['verified'],
    where: {
      email: user.primaryEmail,
    },
  });

  assertKoaCondition(
    user.primaryEmail && userEmailAuthorization.verified,
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

  try {
    const organization = await Organization.create({
      id,
      name,
      email,
      description,
      website,
      icon: icon ? await uploadToBuffer(icon.path) : null,
    });

    await OrganizationMember.create({
      OrganizationId: organization.id,
      UserId: user.id,
      role: PredefinedOrganizationRole.Owner,
    });

    ctx.body = {
      id: organization.id,
      name: organization.name,
      iconUrl: icon
        ? `/api/organizations/${organization.id}/icon?updated=${organization.created.toISOString()}`
        : null,
      description: organization.description,
      website: organization.website,
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
    };
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, `Another organization with the id “${id}” already exists`);
    }

    throw error;
  }
}
