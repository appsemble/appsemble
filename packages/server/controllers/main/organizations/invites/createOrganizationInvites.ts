import { randomBytes } from 'node:crypto';

import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import {
  EmailAuthorization,
  Organization,
  OrganizationInvite,
  OrganizationMember,
  User,
} from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function createOrganizationInvites(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { organizationId },
    request: { body },
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.CreateOrganizationInvites],
  });

  const organization = await Organization.findByPk(organizationId, { attributes: ['id'] });

  assertKoaCondition(organization != null, ctx, 404, 'Organization not found');

  const organizationMembers = await OrganizationMember.findAll({
    where: {
      OrganizationId: organizationId,
    },
    include: [
      {
        model: User,
        attributes: ['primaryEmail'],
        include: [{ model: EmailAuthorization, attributes: ['email'] }],
      },
    ],
  });

  const organizationInvites = await OrganizationInvite.findAll({
    attributes: ['email'],
    where: {
      OrganizationId: organizationId,
    },
  });

  const memberEmails = new Set(
    organizationMembers.flatMap(({ User: { EmailAuthorizations } }) =>
      EmailAuthorizations.flatMap(({ email }) => email),
    ),
  );

  const newInvites = (body as OrganizationInvite[])
    .map((invite) => ({
      email: invite.email.toLowerCase(),
      role: invite.role,
    }))
    .filter((invite) => !memberEmails.has(invite.email));

  assertKoaCondition(
    newInvites.length > 0,
    ctx,
    400,
    'All invited users are already part of this organization',
  );

  const existingInvites = new Set(organizationInvites.flatMap(({ email }) => email));

  const pendingInvites = newInvites.filter((invite) => !existingInvites.has(invite.email));

  assertKoaCondition(
    pendingInvites.length > 0,
    ctx,
    400,
    'All email addresses are already invited to this organization',
  );

  const auths = await EmailAuthorization.findAll({
    include: [{ model: User }],
    where: { email: { [Op.in]: pendingInvites.map((invite) => invite.email) } },
  });

  const userMap = new Map(auths.map((auth) => [auth.email, auth.User]));

  const result = await OrganizationInvite.bulkCreate(
    pendingInvites.map((invite) => {
      const user = userMap.get(invite.email);
      const key = randomBytes(20).toString('hex');
      return user
        ? {
            email: user?.primaryEmail ?? invite.email,
            UserId: user.id,
            key,
            OrganizationId: organizationId,
            role: invite.role,
          }
        : { email: invite.email, role: invite.role, key, OrganizationId: organizationId };
    }),
  );

  await Promise.all(
    result.map(async (invite) => {
      const user = await User.findOne({
        where: {
          primaryEmail: invite.email,
        },
      });
      return mailer.sendTranslatedEmail({
        to: {
          ...(user ? { name: user.name } : {}),
          email: invite.email,
        },
        emailName: 'organizationInvite',
        ...(user ? { locale: user.locale } : {}),
        values: {
          link: (text) => `[${text}](${argv.host}/organization-invite?token=${invite.key})`,
          organization: organizationId,
          name: user?.name || 'null',
          appName: 'null',
        },
      });
    }),
  );
  ctx.body = result.map(({ email, role }) => ({ email, role }));
}
