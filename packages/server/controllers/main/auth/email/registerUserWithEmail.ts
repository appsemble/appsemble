import { randomBytes } from 'node:crypto';

import { assertKoaCondition, logger, throwKoaError } from '@appsemble/node-utils';
import { hash } from 'bcrypt';
import { type Context } from 'koa';
import { DatabaseError, UniqueConstraintError } from 'sequelize';

import { EmailAuthorization, transactional, User } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { createJWTResponse } from '../../../../utils/createJWTResponse.js';

export async function registerUserWithEmail(ctx: Context): Promise<void> {
  assertKoaCondition(!argv.disableRegistration, ctx, 403, 'Registration is disabled');
  const {
    mailer,
    request: {
      body: { locale, name, password, subscribed, timezone },
    },
  } = ctx;

  const email = ctx.request.body.email.toLowerCase();
  const hashedPassword = await hash(password, 10);
  const key = randomBytes(40).toString('hex');
  let user: User;

  try {
    await transactional(async (transaction) => {
      user = await User.create(
        { name, password: hashedPassword, primaryEmail: email, timezone, subscribed, locale },
        { transaction },
      );
      await EmailAuthorization.create({ UserId: user.id, email, key }, { transaction });
    });
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throwKoaError(ctx, 409, 'User with this email address already exists.');
    }

    if (error instanceof DatabaseError) {
      // XXX: Postgres throws a generic transaction aborted error
      // if there is a way to read the internal error, replace this code.
      throwKoaError(ctx, 409, 'User with this email address already exists.');
    }

    throw error;
  }

  mailer
    .sendTranslatedEmail({
      to: {
        name,
        email,
      },
      emailName: 'welcome',
      locale,
      values: {
        link: (text) => `[${text}](${argv.host}/verify?token=${key})`,
        name: name || 'null',
        appName: 'null',
      },
    })
    .catch((error: Error) => {
      logger.error(error);
    });

  ctx.body = createJWTResponse(user.id);
}
