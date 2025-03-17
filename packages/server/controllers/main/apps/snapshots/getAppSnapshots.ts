import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppSnapshot, User } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function getAppSnapshots(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: {
      model: AppSnapshot,
      attributes: { exclude: ['yaml'] },
      include: [{ model: User, required: false }],
    },
  });

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryApps],
  });

  ctx.body = app.AppSnapshots.sort((a, b) => b.id - a.id).map((snapshot) => ({
    id: snapshot.id,
    $created: snapshot.created,
    $author: {
      id: snapshot?.User?.id,
      name: snapshot?.User?.name,
    },
  }));
}
