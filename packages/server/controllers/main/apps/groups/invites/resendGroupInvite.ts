import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB, User } from '../../../../../models/index.js';
import { getAppUrl } from '../../../../../utils/app.js';
import { checkUserOrganizationPermissions } from '../../../../../utils/authorization.js';

export async function resendGroupInvite(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId, groupId },
    request,
  } = ctx;
  const { Group, GroupInvite } = await getAppDB(appId);
  const group = await Group.findByPk(groupId, { attributes: ['name'] });

  assertKoaCondition(group != null, ctx, 404, 'Group not found.');

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'domain', 'path'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.CreateGroupInvites],
  });

  const email = request.body.email.toLowerCase();
  const existingGroupInvite = await GroupInvite.findOne({
    where: {
      GroupId: groupId,
      email,
    },
  });

  assertKoaCondition(
    existingGroupInvite != null,
    ctx,
    404,
    'This person was not invited previously.',
  );

  try {
    const user = await User.findOne({
      where: {
        primaryEmail: existingGroupInvite.email,
      },
    });

    const url = new URL('/Group-Invite', getAppUrl(app));
    url.searchParams.set('token', existingGroupInvite.key);

    await mailer.sendTranslatedEmail({
      to: {
        ...(user ? { name: user.name } : {}),
        email: existingGroupInvite.email,
      },
      emailName: 'groupInvite',
      ...(user ? { locale: user.locale } : {}),
      values: {
        link: (text) => `[${text}](${String(url)})`,
        name: user?.name || 'null',
        groupName: group.name,
        appName: app.definition.name,
      },
    });
  } catch (error: any) {
    throwKoaError(ctx, 400, error.message || 'Something went wrong when sending the invite.');
  }

  ctx.body = 204;
}
