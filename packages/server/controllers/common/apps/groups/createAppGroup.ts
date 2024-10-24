import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppMember, Group, GroupMember } from '../../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function createAppGroup(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { annotations, name },
    },
  } = ctx;

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [AppPermission.CreateGroups],
  });

  const app = await App.findByPk(appId, { attributes: ['demoMode', 'definition'] });
  assertKoaError(!app.definition.security, ctx, 400, 'App does not have a security definition');

  const group = await Group.create({
    name,
    AppId: appId,
    annotations: annotations || undefined,
    demo: app.demoMode,
  });

  if (app.demoMode) {
    const demoMembers = await AppMember.findAll({
      where: { AppId: appId, demo: true },
      attributes: ['id'],
    });
    await GroupMember.bulkCreate(
      demoMembers.map((member) => ({
        AppMemberId: member.id,
        GroupId: group.id,
        demo: true,
        role: member.role,
      })),
    );
  }

  ctx.body = {
    id: group.id,
    name: group.name,
    annotations: group.annotations ?? {},
  };
}
