import { randomBytes } from 'node:crypto';

import { assertKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import {
  EmailAuthorization,
  Organization,
  OrganizationInvite,
  User,
} from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function createOrganizationInvites(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { organizationId },
    request: { body },
  } = ctx;

  const allInvites = (body as OrganizationInvite[]).map((invite) => ({
    email: invite.email.toLowerCase(),
    role: invite.role,
  }));

  const member = await checkRole(ctx, organizationId, Permissions.InviteMember, {
    include: [
      {
        model: Organization,
        attributes: ['id'],
        include: [
          {
            model: User,
            attributes: ['primaryEmail'],
            include: [{ model: EmailAuthorization, attributes: ['email'] }],
          },
          { model: OrganizationInvite, attributes: ['email'] },
        ],
      },
    ],
  });

  const memberEmails = new Set(
    member.Organization.Users.flatMap(({ EmailAuthorizations }) =>
      EmailAuthorizations.flatMap(({ email }) => email),
    ),
  );
  const newInvites = allInvites.filter((invite) => !memberEmails.has(invite.email));

  assertKoaError(
    !newInvites.length,
    ctx,
    400,
    'All invited users are already part of this organization',
  );

  const existingInvites = new Set(
    member.Organization.OrganizationInvites.flatMap(({ email }) => email),
  );
  const pendingInvites = newInvites.filter((invite) => !existingInvites.has(invite.email));

  assertKoaError(
    !pendingInvites.length,
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
