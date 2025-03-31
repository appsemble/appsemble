import { randomBytes } from 'node:crypto';

import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { EmailAuthorization, User } from '../../../../../models/index.js';
import { argv } from '../../../../../utils/argv.js';

export async function addCurrentUserEmail(ctx: Context): Promise<void> {
  const { mailer, request, user: authSubject } = ctx;

  const email = request.body.email.toLowerCase();
  const dbEmail = await EmailAuthorization.findOne({
    where: { email },
  });

  assertKoaCondition(!dbEmail, ctx, 409, 'This email has already been registered.');

  const user = (await User.findByPk(authSubject!.id, {
    include: [
      {
        model: EmailAuthorization,
      },
    ],
  }))!;

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
