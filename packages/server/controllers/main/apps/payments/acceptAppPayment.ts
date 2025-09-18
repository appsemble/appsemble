import axios from 'axios';
import { type Context } from 'koa';

import { AppWebhookSecret } from '../../../../models/AppWebhookSecret.js';
import { argv } from '../../../../utils/argv.js';

export async function acceptAppPayment(ctx: Context): Promise<void> {
  const appId = ctx.request.url.split('/')[ctx.path.split('/').length - 2];
  const webhookSecret = await AppWebhookSecret.findOne({
    where: { AppId: appId, webhookName: 'accept-payment' },
    attributes: ['secret'],
  });

  axios.post(`${argv.host}/api/apps/${appId}/webhooks/accept-payment`, ctx.request.body, {
    headers: {
      Authorization: `Bearer ${Buffer.from(webhookSecret?.dataValues.secret).toString('hex')}`,
    },
  });
  ctx.body = {};
}
