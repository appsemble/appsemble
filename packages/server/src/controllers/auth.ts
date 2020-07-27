import { logger } from '@appsemble/node-utils';
import Boom from '@hapi/boom';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { DatabaseError, UniqueConstraintError } from 'sequelize';

import { EmailAuthorization, ResetPasswordToken, transactional, User } from '../models';
import type { KoaContext } from '../types';
import createJWTResponse from '../utils/createJWTResponse';

async function mayRegister({ argv }: KoaContext): Promise<void> {
  if (argv.disableRegistration) {
    throw Boom.forbidden('Registration is disabled');
  }
}

export async function registerEmail(ctx: KoaContext): Promise<void> {
  await mayRegister(ctx);
  const {
    argv,
    mailer,
    request: {
      body: { email, name, password },
    },
  } = ctx;

  const hashedPassword = await bcrypt.hash(password, 10);
  const key = crypto.randomBytes(40).toString('hex');
  let user: User;

  try {
    await transactional(async (transaction) => {
      user = await User.create(
        { name, password: hashedPassword, primaryEmail: email },
        { transaction },
      );
      await EmailAuthorization.create({ UserId: user.id, email, key }, { transaction });
    });
  } catch (e) {
    if (e instanceof UniqueConstraintError) {
      throw Boom.conflict('User with this email address already exists.');
    }

    if (e instanceof DatabaseError) {
      // XXX: Postgres throws a generic transaction aborted error
      // if there is a way to read the internal error, replace this code.
      throw Boom.conflict('User with this email address already exists.');
    }

    throw e;
  }

  // This is purposely not awaited, so failure won’t make the request fail. If this fails, the user
  // will still be logged in, but will have to request a new verification email in order to verify
  // their account.
  mailer
    .sendTemplateEmail({ email, name }, 'welcome', {
      url: `${argv.host}/verify?token=${key}`,
    })
    .catch((error) => {
      logger.error(error);
    });

  ctx.body = createJWTResponse(user.id, argv);
}

export async function verifyEmail(ctx: KoaContext): Promise<void> {
  const {
    request: {
      body: { token },
    },
  } = ctx;

  const email = await EmailAuthorization.findOne({ where: { key: token } });

  if (!email) {
    throw Boom.notFound('Unable to verify this token.');
  }

  email.verified = true;
  email.key = null;
  await email.save();

  ctx.status = 200;
}

export async function resendEmailVerification(ctx: KoaContext): Promise<void> {
  const {
    argv: { host },
    mailer,
    request: {
      body: { email },
    },
  } = ctx;

  const record = await EmailAuthorization.findByPk(email, { raw: true });
  if (record && !record.verified) {
    const { key } = record;
    await mailer.sendTemplateEmail(record, 'resend', {
      url: `${host}/verify?token=${key}`,
    });
  }

  ctx.status = 204;
}

export async function requestResetPassword(ctx: KoaContext): Promise<void> {
  const {
    argv: { host },
    mailer,
    request: {
      body: { email },
    },
  } = ctx;

  const emailRecord = await EmailAuthorization.findByPk(email);

  if (emailRecord) {
    const user = await User.findByPk(emailRecord.UserId);

    const { name } = user;
    const token = crypto.randomBytes(40).toString('hex');
    await ResetPasswordToken.create({ UserId: user.id, token });
    await mailer.sendTemplateEmail({ email, name }, 'reset', {
      url: `${host}/edit-password?token=${token}`,
    });
  }

  ctx.status = 204;
}

export async function resetPassword(ctx: KoaContext): Promise<void> {
  const {
    request: {
      body: { token },
    },
  } = ctx;

  const tokenRecord = await ResetPasswordToken.findByPk(token);

  if (!tokenRecord) {
    throw Boom.notFound(`Unknown password reset token: ${token}`);
  }

  const password = await bcrypt.hash(ctx.request.body.password, 10);
  const user = await User.findByPk(tokenRecord.UserId);

  await user.update({ password });
  await tokenRecord.destroy();
}
