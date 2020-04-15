import { logger } from '@appsemble/node-utils';
import { normalize } from '@appsemble/utils';
import Boom from '@hapi/boom';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { DatabaseError, UniqueConstraintError } from 'sequelize';

import { EmailAuthorization, OAuthAuthorization, ResetPasswordToken, User } from '../models';
import createJWTResponse from '../utils/createJWTResponse';

async function mayRegister({ argv }) {
  if (argv.disableRegistration) {
    throw Boom.forbidden('Registration is disabled');
  }
}

async function registerUser(associatedModel, organizationName, transaction, email, password) {
  await associatedModel.createUser({ password, primaryEmail: email }, { transaction });

  if (organizationName) {
    const user = await associatedModel.getUser({ transaction });
    await user.createOrganization(
      {
        id: normalize(organizationName),
        name: organizationName,
      },
      { transaction, through: { verified: true } },
    );
  }
}

export async function registerEmail(ctx) {
  await mayRegister(ctx);
  const { argv, mailer } = ctx;
  const { email, password } = ctx.request.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const key = crypto.randomBytes(40).toString('hex');
  let user;

  try {
    await ctx.db.transaction(async (transaction) => {
      user = await User.create({ password: hashedPassword, primaryEmail: email }, { transaction });
      await user.createEmailAuthorization({ email, key }, { transaction });
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
    .sendEmail({ email }, 'welcome', {
      url: `${ctx.origin}/verify?token=${key}`,
    })
    .catch((error) => {
      logger.error(error);
    });

  ctx.body = createJWTResponse(user.id, argv);
}

export async function registerOAuth(ctx) {
  await mayRegister(ctx);
  const {
    body: { accessToken, id, organization, provider },
  } = ctx.request;
  const auth = await OAuthAuthorization.findOne({ where: { provider, id, token: accessToken } });
  if (!auth) {
    throw Boom.notFound('Could not find any matching credentials.');
  }

  try {
    await ctx.db.transaction(async (transaction) => {
      await registerUser(auth, organization, transaction);
    });
  } catch (e) {
    if (e instanceof UniqueConstraintError) {
      const [{ instance }] = e.errors;

      if (instance instanceof OAuthAuthorization) {
        throw Boom.conflict('User with this email address already exists.');
      }
    }

    throw e;
  }
  ctx.status = 201;
}

export async function connectOAuth(ctx) {
  const {
    body: { accessToken, id, provider, userId },
  } = ctx.request;

  const auth = await OAuthAuthorization.findOne({ where: { provider, id, token: accessToken } });
  const user = await User.findById(userId);

  if (!auth || !user) {
    throw Boom.notFound("User or credential doesn't exist.");
  }

  await user.addOAuthAuthorization(auth);

  ctx.status = 200;
}

export async function verifyEmail(ctx) {
  const {
    body: { token },
  } = ctx.request;

  const email = await EmailAuthorization.findOne({ where: { key: token } });

  if (!email) {
    throw Boom.notFound('Unable to verify this token.');
  }

  email.verified = true;
  email.key = null;
  await email.save();

  ctx.status = 200;
}

export async function resendEmailVerification(ctx) {
  const { mailer } = ctx;
  const { email } = ctx.request.body;

  const record = await EmailAuthorization.findByPk(email, { raw: true });
  if (record && !record.verified) {
    const { key } = record;
    await mailer.sendEmail(record, 'resend', {
      url: `${ctx.origin}/verify?token=${key}`,
    });
  }

  ctx.status = 204;
}

export async function requestResetPassword(ctx) {
  const { mailer } = ctx;
  const { email } = ctx.request.body;

  const emailRecord = await EmailAuthorization.findByPk(email);

  if (emailRecord) {
    const user = await emailRecord.getUser();

    const { name } = user;
    const token = crypto.randomBytes(40).toString('hex');
    await user.createResetPasswordToken({ token });
    await mailer.sendEmail({ email, name }, 'reset', {
      url: `${ctx.origin}/edit-password?token=${token}`,
    });
  }

  ctx.status = 204;
}

export async function resetPassword(ctx) {
  const { token } = ctx.request.body;

  const tokenRecord = await ResetPasswordToken.findByPk(token);

  if (!tokenRecord) {
    throw Boom.notFound(`Unknown password reset token: ${token}`);
  }

  const password = await bcrypt.hash(ctx.request.body.password, 10);
  const user = await tokenRecord.getUser();

  await user.update({ password });
  await tokenRecord.destroy();
}
