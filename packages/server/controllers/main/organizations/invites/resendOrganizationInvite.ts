import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { Organization, OrganizationInvite, User } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function resendOrganizationInvite(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { organizationId },
    request,
  } = ctx;

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId,
    requiredPermissions: [OrganizationPermission.CreateOrganizationInvites],
  });

  const organization = await Organization.findByPk(organizationId, { attributes: ['id'] });

  assertKoaCondition(!!organization, ctx, 404, 'Organization not found.');

  const email = request.body.email.toLowerCase();
  const existingOrganizationInvite = await OrganizationInvite.findOne({
    where: {
      OrganizationId: organizationId,
      email,
    },
    include: [User],
  });

  assertKoaCondition(
    !!existingOrganizationInvite,
    ctx,
    404,
    'This person was not invited previously.',
  );

  try {
    await mailer.sendTranslatedEmail({
      to: {
        ...(existingOrganizationInvite.User ? { name: existingOrganizationInvite.User.name } : {}),
        email,
      },
      emailName: 'organizationInvite',
      ...(existingOrganizationInvite.User
        ? { locale: existingOrganizationInvite.User.locale }
        : {}),
      values: {
        link: (text) =>
          `[${text}](${argv.host}/organization-invite?token=${existingOrganizationInvite.key})`,
        organization: organizationId,
        name: existingOrganizationInvite.User?.name || 'null',
        appName: 'null',
      },
    });
  } catch (error: any) {
    throwKoaError(ctx, 400, error.message || 'Something went wrong when sending the invite.');
  }

  ctx.body = 204;
}
