import { type Context } from 'koa';
import getRawBody from 'raw-body';
import { EmailAuthorization } from '../../../models/index.js';
import { throwKoaError } from '@appsemble/node-utils';
import { argv } from '../../../utils/argv.js';

export async function undeliveredEmails(ctx: Context): Promise<void> {
  const {
    queryParams: { secret },
  } = ctx;
  if (secret !== argv.postalSecret) {
    throwKoaError(ctx, 401, 'unauthorized');
  }
  const event = JSON.parse(await getRawBody(ctx.req, { encoding: 'utf8' }));

  if (event?.bounce || event?.status === 'MessageDeliveryFailed') {
    const receiver = event?.bounce?.to || event?.message?.to;
    const email = await EmailAuthorization.findOne({ where: { email: receiver } });
    if (email) {
      email.disabled = new Date();
      email.save();
    }
  }

  ctx.body = {};
}
