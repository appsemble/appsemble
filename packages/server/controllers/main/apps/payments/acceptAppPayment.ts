import { assertKoaCondition } from '@appsemble/node-utils';
import axios from 'axios';
import { type Context } from 'koa';

import { getAppDB } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';

export async function acceptAppPayment(ctx: Context): Promise<void> {
  const appId = ctx.request.url.split('/')[ctx.path.split('/').length - 2];

  const { AppWebhookSecret } = await getAppDB(Number(appId));
  const webhookSecret = await AppWebhookSecret.findOne({
    where: { webhookName: 'accept-payment' },
    attributes: ['secret'],
  });

  assertKoaCondition(webhookSecret != null, ctx, 401, 'Missing webhook secret for accept-payment');

  axios.post(`${argv.host}/api/apps/${appId}/webhooks/accept-payment`, ctx.request.body, {
    headers: {
      Authorization: `Bearer ${Buffer.from(webhookSecret?.dataValues.secret).toString('hex')}`,
    },
  });

  ctx.body = {};
}
