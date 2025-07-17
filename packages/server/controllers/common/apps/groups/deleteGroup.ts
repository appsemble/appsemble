import { AppPermission } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { getAppDB } from '../../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function deleteGroup(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, groupId },
  } = ctx;
  const { Group } = await getAppDB(appId);
  const group = await Group.findByPk(groupId);

  assertKoaCondition(group != null, ctx, 404, 'Group not found');

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId,
    groupId,
    requiredPermissions: [AppPermission.DeleteGroups],
  });

  await group.destroy();
}
