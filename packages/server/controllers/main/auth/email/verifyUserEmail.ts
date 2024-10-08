import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { EmailAuthorization } from '../../../../models/index.js';

export async function verifyUserEmail(ctx: Context): Promise<void> {
  const {
    request: {
      body: { token },
    },
  } = ctx;

  const email = await EmailAuthorization.findOne({ where: { key: token } });

  assertKoaError(!email, ctx, 404, 'Unable to verify this token.');

  email.verified = true;
  email.key = null;
  await email.save();

  ctx.status = 200;
}
