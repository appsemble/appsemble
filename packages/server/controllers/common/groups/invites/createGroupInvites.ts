import { randomBytes } from 'node:crypto';

import { assertKoaCondition } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { getAppRoles } from '@appsemble/utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import {
  App,
  AppMember,
  EmailAuthorization,
  Group,
  GroupInvite,
  GroupMember,
  User,
} from '../../../../models/index.js';
import { getAppUrl } from '../../../../utils/app.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function createGroupInvites(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { groupId },
    queryParams: { selectedGroupId },
    request: { body },
  } = ctx;

  const group = await Group.findOne({ where: { id: groupId } });
  assertKoaCondition(group != null, ctx, 400, `Group ${groupId} does not exist`);

  const app = await App.findByPk(group.AppId, {
    attributes: ['id', 'definition', 'path', 'OrganizationId', 'domain'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  assertKoaCondition(
    app.definition.security != null,
    ctx,
    403,
    'App does not have a security definition.',
  );

  const appRoles = getAppRoles(app.definition.security);

  assertKoaCondition(
    !(body as GroupInvite[]).some((invite) => !appRoles.includes(invite.role)),
    ctx,
    403,
    'Role not allowed.',
  );

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId: app.id,
    requiredPermissions: [AppPermission.CreateGroupInvites],
    groupId: selectedGroupId,
  });

  const groupMembers = await GroupMember.findAll({
    attributes: ['id'],
    where: { GroupId: groupId },
    include: [
      {
        attributes: ['email'],
        model: AppMember,
      },
    ],
  });

  const groupInvites = await GroupInvite.findAll({
    attributes: ['email'],
    where: { GroupId: groupId },
  });

  const memberEmails = new Set(groupMembers.flatMap((groupMember) => groupMember.AppMember.email));

  const newInvites = (body as GroupInvite[])
    .map((invite) => ({
      email: invite.email.toLowerCase(),
      role: invite.role,
    }))
    .filter((invite) => !memberEmails.has(invite.email));

  assertKoaCondition(
    newInvites.length > 0,
    ctx,
    400,
    'All invited emails are already members of this group',
  );

  const existingInvites = new Set(groupInvites.flatMap(({ email }) => email));

  const pendingInvites = newInvites.filter((invite) => !existingInvites.has(invite.email));

  assertKoaCondition(
    pendingInvites.length > 0,
    ctx,
    400,
    'All email addresses are already invited to this group',
  );

  const auths = await EmailAuthorization.findAll({
    include: [{ model: User }],
    where: { email: { [Op.in]: pendingInvites.map((invite) => invite.email) } },
  });

  const userMap = new Map(auths.map((auth) => [auth.email, auth.User]));

  const result = await GroupInvite.bulkCreate(
    pendingInvites.map((invite) => {
      const user = userMap.get(invite.email);
      const key = randomBytes(20).toString('hex');
      return user
        ? {
            email: user?.primaryEmail ?? invite.email,
            UserId: user.id,
            key,
            GroupId: groupId,
            role: invite.role,
          }
        : { email: invite.email, role: invite.role, key, GroupId: groupId };
    }),
  );

  await Promise.all(
    result.map(async (invite) => {
      const user = await User.findOne({
        where: {
          primaryEmail: invite.email,
        },
      });

      const url = new URL('/Group-Invite', getAppUrl(app));
      url.searchParams.set('token', invite.key);

      return mailer.sendTranslatedEmail({
        to: {
          ...(user ? { name: user.name } : {}),
          email: invite.email,
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
    }),
  );
  ctx.body = result.map(({ email, role }) => ({ email, role }));
}
