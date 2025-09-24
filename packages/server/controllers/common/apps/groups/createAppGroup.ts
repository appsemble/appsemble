import { AppPermission } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
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
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  assertKoaCondition(
    app.definition.security != null,
    ctx,
    400,
    'App does not have a security definition',
  );

  const { AppMember, Group, GroupMember } = await getAppDB(appId);
  const group = await Group.create({
    name,
    annotations: annotations || undefined,
    demo: app.demoMode,
  });

  if (app.demoMode) {
    const demoMembers = await AppMember.findAll({
      where: { demo: true },
      attributes: ['id', 'role'],
    });
    await GroupMember.bulkCreate(
      demoMembers.map((member) => ({
        GroupId: group.id,
        demo: true,
        role: member.role,
        AppMemberId: member.id,
      })),
    );
  }

  ctx.body = {
    id: group.id,
    name: group.name,
    annotations: group.annotations ?? {},
  };
}
