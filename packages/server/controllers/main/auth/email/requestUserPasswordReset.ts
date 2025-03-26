import { randomBytes } from 'node:crypto';

import { logger } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { EmailAuthorization, ResetPasswordToken, User } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';

export async function requestUserPasswordReset(ctx: Context): Promise<void> {
  const { mailer, request } = ctx;

  const email = request.body.email.toLowerCase();
  const emailRecord = await EmailAuthorization.findByPk(email);

  if (emailRecord) {
    const user = await User.findByPk(emailRecord.UserId);

    const token = randomBytes(40).toString('hex');
    await ResetPasswordToken.create({ UserId: user.id, token });
    await mailer
      .sendTranslatedEmail({
        to: {
          name: user.name,
          // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
          email: user.primaryEmail,
        },
        emailName: 'reset',
        locale: user.locale,
        values: {
          link: (text) => `[${text}](${argv.host}/edit-password?token=${token})`,
          name: user.name || 'null',
          appName: 'null',
        },
      })
      .catch((error: Error) => {
        logger.error(error);
      });
  }

  ctx.status = 204;
}
