import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppSubscription } from '../../../models/index.js';

export async function createAppSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { endpoint, keys },
    },
    user: appMember,
  } = ctx;

  const app = await App.findByPk(appId, { attributes: [], include: [AppSubscription] });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await AppSubscription.create({
    AppId: appId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    AppMemberId: appMember ? appMember.id : null,
  });
}
