import { logger } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { EmailAuthorization, User } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';

export async function resendUserEmailVerification(ctx: Context): Promise<void> {
  const { mailer, request } = ctx;

  const email = request.body.email.toLowerCase();
  const record = await EmailAuthorization.findByPk(email, {
    include: [{ model: User, attributes: ['name', 'locale'] }],
  });
  if (record && !record.verified) {
    const { key } = record;
    await mailer
      .sendTranslatedEmail({
        to: {
          name: record.User!.name,
          email: record.email,
        },
        emailName: 'resend',
        locale: record.User!.locale,
        values: {
          link: (text) => `[${text}](${argv.host}/verify?token=${key})`,
          name: record.User!.name || 'null',
          appName: 'null',
        },
      })
      .catch((error: Error) => {
        logger.error(error);
      });
  }

  ctx.status = 204;
}
