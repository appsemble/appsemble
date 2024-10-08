import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppSubscription } from '../../../../models/index.js';

export async function createAppSubscription(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { endpoint, keys },
    },
    user,
  } = ctx;

  const app = await App.findByPk(appId, { attributes: [], include: [AppSubscription] });

  assertKoaError(!app, ctx, 404, 'App not found');

  await AppSubscription.create({
    AppId: appId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    UserId: user ? user.id : null,
  });
}
