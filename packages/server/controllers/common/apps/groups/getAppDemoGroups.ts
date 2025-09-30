import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';

export async function getAppDemoGroups(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const { Group } = await getAppDB(appId);
  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'definition', 'demoMode'],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  assertKoaCondition(app.demoMode, ctx, 401, 'App is not in demo mode');

  const groups = await Group.findAll({ where: { demo: true } });

  ctx.body = groups.map((group) => ({
    id: group.id,
    name: group.name,
    size: group.Members?.length ?? 0,
    annotations: group.annotations ?? {},
  }));
}
