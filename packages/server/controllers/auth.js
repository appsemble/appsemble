import crypto from 'crypto';

import bcrypt from 'bcrypt';
import Boom from 'boom';
import { UniqueConstraintError } from 'sequelize';

import { resendVerificationEmail, sendResetPasswordEmail, sendWelcomeEmail } from '../utils/email';

async function mayRegister({ argv }) {
  if (argv.disableRegistration) {
    throw Boom.forbidden('Registration is disabled');
  }
}

async function registerUser(associatedModel, organizationName, transaction) {
  await associatedModel.createUser({}, { transaction });
  const user = await associatedModel.getUser({ transaction });
  await user.createOrganization(
    {
      id: organizationName || `organization${new Date().getTime()}`,
    },
    { transaction },
  );
}

export async function registerEmail(ctx) {
  await mayRegister(ctx);
  const { body } = ctx.request;
  const { EmailAuthorization } = ctx.db.models;
  const { smtp } = ctx.state;

  try {
    const password = await bcrypt.hash(body.password, 10);
    const key = crypto.randomBytes(40).toString('hex');

    await ctx.db.transaction(async transaction => {
      const record = await EmailAuthorization.create({ ...body, password, key }, { transaction });
      await registerUser(record, body.organization, transaction);

      await sendWelcomeEmail(
        {
          email: record.email,
          name: record.name,
          url: `${ctx.origin}/_/verify?token=${key}`,
        },
        smtp,
      );

      ctx.status = 201;
    });
  } catch (e) {
    if (e instanceof UniqueConstraintError) {
      const [{ instance }] = e.errors;

      if (instance instanceof EmailAuthorization) {
        throw Boom.conflict('User with this email address already exists.');
      } else {
        throw Boom.conflict('This organization already exists.');
      }
    }

    throw e;
  }
}

export async function registerOAuth(ctx) {
  await mayRegister(ctx);
  const {
    body: { provider, id, accessToken, organization },
  } = ctx.request;
  const { OAuthAuthorization } = ctx.db.models;
  const auth = await OAuthAuthorization.findOne({ where: { provider, id, token: accessToken } });
  if (!auth) {
    throw Boom.notFound('Could not find any matching credentials.');
  }

  try {
    await ctx.db.transaction(async transaction => {
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
    body: { provider, id, accessToken, userId },
  } = ctx.request;

  const { OAuthAuthorization, User } = ctx.db.models;
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
  const { EmailAuthorization } = ctx.db.models;

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
  const { email } = ctx.request.body;
  const { EmailAuthorization } = ctx.db.models;
  const { smtp } = ctx.state;

  const record = await EmailAuthorization.findByPk(email, { raw: true });
  if (record && !record.verified) {
    const { name, key } = record;
    await resendVerificationEmail(
      {
        email,
        name,
        url: `${ctx.origin}/_/verify?token=${key}`,
      },
      smtp,
    );
  }

  ctx.status = 204;
}

export async function requestResetPassword(ctx) {
  const { email } = ctx.request.body;
  const { EmailAuthorization } = ctx.db.models;
  const { smtp } = ctx.state;

  const record = await EmailAuthorization.findByPk(email);

  if (record) {
    const { name } = record;
    const token = crypto.randomBytes(40).toString('hex');
    await record.createResetPasswordToken({ token });
    await sendResetPasswordEmail(
      { email, name, url: `${ctx.origin}/_/edit-password?token=${token}` },
      smtp,
    );
  }

  ctx.status = 204;
}

export async function resetPassword(ctx) {
  const { token } = ctx.request.body;
  const { ResetPasswordToken } = ctx.db.models;

  const tokenRecord = await ResetPasswordToken.findByPk(token);

  if (!tokenRecord) {
    ctx.throw(404);
    return;
  }

  const password = await bcrypt.hash(ctx.request.body.password, 10);
  const email = await tokenRecord.getEmailAuthorization();

  await email.update({ password });
  await tokenRecord.destroy();
}
