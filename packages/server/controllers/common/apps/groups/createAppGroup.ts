import { AppPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { Group, transactional } from '../../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function createAppGroup(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { annotations, name },
    },
  } = ctx;

  await checkAuthSubjectAppPermissions(ctx, appId, [AppPermission.CreateGroups]);

  await transactional(async (transaction) => {
    const group = await Group.create(
      { name, AppId: appId, annotations: annotations || undefined },
      { transaction },
    );

    ctx.body = {
      id: group.id,
      name: group.name,
      annotations: group.annotations ?? {},
    };
  });
}
