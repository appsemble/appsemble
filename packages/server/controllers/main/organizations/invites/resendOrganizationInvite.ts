import { assertKoaError, throwKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { Organization, OrganizationInvite, User } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function resendOrganizationInvite(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { organizationId },
    request,
  } = ctx;

  const email = request.body.email.toLowerCase();
  const organization = await Organization.findByPk(organizationId, {
    include: [
      {
        model: OrganizationInvite,
        include: [
          {
            model: User,
          },
        ],
      },
    ],
  });

  assertKoaError(!organization, ctx, 404, 'Organization not found.');

  await checkRole(ctx, organization.id, Permissions.InviteMember);

  const invite = organization.OrganizationInvites.find((i) => i.email === email);

  assertKoaError(!invite, ctx, 404, 'This person was not invited previously.');

  try {
    await mailer.sendTranslatedEmail({
      to: {
        name: invite.User.name,
        email,
      },
      emailName: 'organizationInvite',
      locale: invite.User.locale,
      values: {
        link: (text) => `[${text}](${argv.host}/organization-invite?token=${invite.key})`,
        organization: organizationId,
        name: invite.User.name || 'null',
        appName: 'null',
      },
    });
  } catch (error: any) {
    throwKoaError(ctx, 400, error.message || 'Something went wrong when sending the invite.');
  }

  ctx.body = 204;
}
