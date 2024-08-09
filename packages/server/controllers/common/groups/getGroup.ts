import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { Group } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function getGroup(ctx: Context): Promise<void> {
  const {
    pathParams: { groupId },
  } = ctx;

  const group = await Group.findByPk(groupId);

  assertKoaError(!group, ctx, 404, 'Group not found');

  await checkAuthSubjectAppPermissions(ctx, group.AppId, [AppPermission.QueryGroups]);

  ctx.body = {
    id: group.id,
    name: group.name,
    ...(group.annotations && { annotations: group.annotations }),
  };
}
