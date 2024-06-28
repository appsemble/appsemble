import { assertKoaError, organizationBlocklist, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op, UniqueConstraintError } from 'sequelize';

import { EmailAuthorization, Organization, User } from '../../../models/index.js';

export async function createOrganization(ctx: Context): Promise<void> {
  const {
    request: {
      body: { description, email, icon, id, name, website },
    },
    user: authSubject,
  } = ctx;

  const user = await User.findByPk(authSubject.id, {
    attributes: ['primaryEmail', 'name'],
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

  assertKoaError(
    !user.primaryEmail || !userEmailAuthorization.verified,
    ctx,
    403,
    'Email not verified.',
  );

  assertKoaError(
    organizationBlocklist.includes(id),
    ctx,
    400,
    'This organization id is not allowed.',
  );

  try {
    const organization = await Organization.create(
      { id, name, email, description, website, icon: icon ? icon.contents : null },
      { include: [User] },
    );

    // @ts-expect-error XXX Convert to a type safe expression.
    await organization.addUser(user.id, { through: { role: 'Owner' } });
    await organization.reload();

    ctx.body = {
      id: organization.id,
      name: organization.name,
      iconUrl: icon
        ? `/api/organizations/${organization.id}/icon?updated=${organization.created.toISOString()}`
        : null,
      description: organization.description,
      website: organization.website,
      email: organization.email,
      members: organization.Users.map((u) => ({
        id: u.id,
        name: u.name,
        primaryEmail: u.primaryEmail,
        role: 'Owner',
      })),
      invites: [],
    };
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, `Another organization with the id “${id}” already exists`);
    }

    throw error;
  }
}
