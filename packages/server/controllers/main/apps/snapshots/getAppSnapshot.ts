import { assertKoaError } from '@appsemble/node-utils';
import { MainPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppSnapshot, User } from '../../../../models/index.js';
import { checkUserPermissions } from '../../../../utils/authorization.js';

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

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserPermissions(ctx, app.OrganizationId, [MainPermission.QueryApps]);

  assertKoaError(!app.AppSnapshots.length, ctx, 404, 'Snapshot not found');

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
