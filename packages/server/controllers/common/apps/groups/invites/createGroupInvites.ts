import { randomBytes } from 'node:crypto';

import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { getAppRoles } from '@appsemble/utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import {
  App,
  EmailAuthorization,
  getAppDB,
  type GroupInvite,
  User,
} from '../../../../../models/index.js';
import { getAppUrl } from '../../../../../utils/app.js';
import { checkAuthSubjectAppPermissions } from '../../../../../utils/authorization.js';

export async function createGroupInvites(ctx: Context): Promise<void> {
  const {
    mailer,
    pathParams: { appId, groupId },
    queryParams: { selectedGroupId },
    request: { body },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'path', 'OrganizationId', 'domain', 'skipGroupInvites'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { AppMember, Group, GroupInvite, GroupMember } = await getAppDB(appId);
  const group = await Group.findOne({ where: { id: groupId } });
  assertKoaCondition(group != null, ctx, 400, `Group ${groupId} does not exist`);

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

  const memberEmails = new Set(groupMembers.flatMap((groupMember) => groupMember.AppMember!.email));

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

  if (app.skipGroupInvites) {
    const appMembers = await AppMember.findAll({
      where: { AppId: app.id },
      attributes: ['id', 'email'],
    });
    const appMemberEmails = new Set(appMembers.flatMap((member) => member.email));

    for (const newInvite of newInvites) {
      if (!appMemberEmails.has(newInvite.email)) {
        throwKoaError(ctx, 400, `${newInvite.email} is not a member of the app`);
      }
    }

    const results: { id: string; email: string; role: string }[] = [];
    for (const newInvite of newInvites) {
      const appMember = appMembers.find((member) => member.email === newInvite.email);
      const created = await GroupMember.create({
        AppMemberId: appMember!.id,
        GroupId: groupId,
        role: newInvite.role,
      });
      results.push({ id: created.id, email: appMember!.email, role: newInvite.role });
    }

    ctx.body = results;
    ctx.status = 200;
    return;
  }

  const result = await GroupInvite.bulkCreate(
    pendingInvites.map((invite) => {
      const user = userMap.get(invite.email);
      const key = randomBytes(20).toString('hex');
      return user
        ? {
            email: user?.primaryEmail ?? invite.email,
            userId: user.id,
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
        appId: app.id,
        to: {
          ...(user ? { name: user.name } : {}),
          email: invite.email,
        },
        emailName: 'groupInvite',
        ...(app.definition.defaultLanguage ? { locale: app.definition.defaultLanguage } : {}),
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
