import { randomBytes } from 'node:crypto';

import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { EmailAuthorization, type User } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';

export async function addCurrentUserEmail(ctx: Context): Promise<void> {
  const { mailer, request, user } = ctx;

  const email = request.body.email.toLowerCase();
  const dbEmail = await EmailAuthorization.findOne({
    where: { email },
  });

  assertKoaError(Boolean(dbEmail), ctx, 409, 'This email has already been registered.');

  await (user as User).reload({
    include: [
      {
        model: EmailAuthorization,
      },
    ],
  });

  const key = randomBytes(40).toString('hex');
  await EmailAuthorization.create({ UserId: user.id, email, key });

  await mailer.sendTranslatedEmail({
    to: {
      name: user.name,
      email,
    },
    emailName: 'emailAdded',
    locale: user.locale,
    values: {
      link: (text) => `[${text}](${argv.host}/verify?token=${key})`,
      name: user ? user.name : 'null',
      appName: 'null',
    },
  });

  ctx.status = 201;
  ctx.body = {
    email,
    verified: false,
  };
}
