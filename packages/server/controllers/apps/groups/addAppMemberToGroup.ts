import { AppPermission, getAppRoles } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function addAppMemberToGroup(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, groupId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['dbUser', 'dbHost', 'dbPassword', 'dbPort', 'id', 'definition'],
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
    appRoles.includes((body as { role: string; id: string }).role),
    ctx,
    403,
    'Role not allowed.',
  );
  const { AppMember, Group, GroupInvite, GroupMember } = await getAppDB(app.id);

  const group = await Group.findByPk(groupId);
  assertKoaCondition(group != null, ctx, 404, 'Group not found');
  const appMember = await AppMember.findByPk((body as { role: string; id: string }).id);
  assertKoaCondition(appMember != null, ctx, 404, 'App member does not exist');
  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId: app.id,
    requiredPermissions: [AppPermission.CreateGroupMembers],
    groupId,
  });

  const groupMember = await GroupMember.findOne({
    where: { GroupId: group.id, AppMemberId: appMember.id },
  });

  assertKoaCondition(groupMember == null, ctx, 409, 'Group Member already exists');

  const groupInvite = await GroupInvite.findOne({
    where: { email: appMember.email, GroupId: group.id },
  });

  assertKoaCondition(groupInvite == null, ctx, 400, 'User already invited to join the group');

  const createdMember = await GroupMember.create({
    GroupId: group.id,
    AppMemberId: appMember.id,
    role: (body as { role: string; id: string }).role,
  });
  ctx.status = 200;
  ctx.body = createdMember.dataValues;
}
