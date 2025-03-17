import { assertKoaCondition } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, AppSnapshot, User } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function getAppSnapshot(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, snapshotId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
    include: {
      model: AppSnapshot,
      required: false,
      include: [{ model: User, required: false }],
      where: { id: snapshotId },
    },
  });

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [OrganizationPermission.QueryApps],
  });

  assertKoaCondition(!!app.AppSnapshots.length, ctx, 404, 'Snapshot not found');

  const [snapshot] = app.AppSnapshots;
  ctx.body = {
    id: snapshot.id,
    $created: snapshot.created,
    $author: {
      id: snapshot?.User?.id,
      name: snapshot?.User?.name,
    },
    yaml: snapshot.yaml,
  };
}
