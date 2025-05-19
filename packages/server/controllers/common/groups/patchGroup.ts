import { AppPermission } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { Group } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function patchGroup(ctx: Context): Promise<void> {
  const {
    pathParams: { groupId },
    request: {
      body: { annotations, name },
    },
  } = ctx;

  const group = await Group.findByPk(groupId);

  assertKoaCondition(group != null, ctx, 404, 'Group not found');

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId: group.AppId,
    groupId,
    requiredPermissions: [AppPermission.UpdateGroups],
  });

  await group.update({ name: name || undefined, annotations: annotations || undefined });

  ctx.body = {
    name,
    id: group.id,
    ...(annotations && { annotations }),
  };
}
