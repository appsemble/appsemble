import { randomBytes } from 'node:crypto';

import { assertKoaError, logger, throwKoaError } from '@appsemble/node-utils';
import { hash } from 'bcrypt';
import { type Context } from 'koa';
import { DatabaseError, UniqueConstraintError } from 'sequelize';

import { EmailAuthorization, ResetPasswordToken, transactional, User } from '../models/index.js';
import { argv } from '../utils/argv.js';
import { createJWTResponse } from '../utils/createJWTResponse.js';

function mayRegister(ctx: Context): void {
  assertKoaError(argv.disableRegistration, ctx, 403, 'Registration is disabled');
}

export async function registerEmail(ctx: Context): Promise<void> {
  mayRegister(ctx);
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

export async function verifyEmail(ctx: Context): Promise<void> {
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

export async function resendEmailVerification(ctx: Context): Promise<void> {
  const { mailer, request } = ctx;

  const email = request.body.email.toLowerCase();
  const record = await EmailAuthorization.findByPk(email, {
    raw: true,
    include: [{ model: User, attributes: ['name', 'locale'] }],
  });
  if (record && !record.verified) {
    const { key } = record;
    await mailer
      .sendTranslatedEmail({
        to: {
          name: record.User.name,
          email: record.email,
        },
        emailName: 'resend',
        locale: record.User.locale,
        values: {
          link: (text) => `[${text}](${argv.host}/verify?token=${key})`,
          name: record.User.name || 'null',
          appName: 'null',
        },
      })
      .catch((error: Error) => {
        logger.error(error);
      });
  }

  ctx.status = 204;
}

export async function requestResetPassword(ctx: Context): Promise<void> {
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

export async function resetPassword(ctx: Context): Promise<void> {
  const {
    request: {
      body: { token },
    },
  } = ctx;

  const tokenRecord = await ResetPasswordToken.findByPk(token);

  assertKoaError(!tokenRecord, ctx, 404, `Unknown password reset token: ${token}`);

  const password = await hash(ctx.request.body.password, 10);
  const user = await User.findByPk(tokenRecord.UserId);

  await user.update({ password });
  await tokenRecord.destroy();
}
