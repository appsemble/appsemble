import crypto from 'crypto';

import bcrypt from 'bcrypt';
import Boom from 'boom';

import { sendResetPasswordEmail, sendWelcomeEmail, resendVerificationEmail } from '../utils/email';

async function registerUser(associatedModel) {
  await associatedModel.createUser();
  const user = await associatedModel.getUser();
  await user.createOrganization({ name: 'My Organization' });
}

export async function registerEmail(ctx) {
  const { body } = ctx.request;
  const { EmailAuthorization } = ctx.db.models;
  const { smtp } = ctx.state;

  try {
    const password = await bcrypt.hash(body.password, 10);
    const key = crypto.randomBytes(40).toString('hex');
    const record = await EmailAuthorization.create({ ...body, password, key });
    await registerUser(record);

    await sendWelcomeEmail(
      {
        email: record.email,
        name: record.name,
        url: `${ctx.origin}/api/email/verify?key=${key}`,
      },
      smtp,
    );

    ctx.status = 201;
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      throw Boom.conflict('User with this email address already exists.');
    }

    throw e;
  }
}

export async function registerOAuth(ctx) {
  const {
    body: { provider, id, accessToken },
  } = ctx.request;
  const { OAuthAuthorization } = ctx.db.models;
  const auth = await OAuthAuthorization.findOne({ where: { provider, id, token: accessToken } });

  if (!auth) {
    throw Boom.notFound('Could not find any matching credentials.');
  }

  await registerUser(auth);

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
  const { key } = ctx.request.query;
  const { EmailAuthorization } = ctx.db.models;

  const email = await EmailAuthorization.findOne({ where: { key } });

  if (!email) {
    throw Boom.notFound('Unable to verify this key.');
  }

  email.verified = true;
  email.key = null;
  await email.save();

  ctx.status = 200;
}

export async function resendVerification(ctx) {
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
        url: `${ctx.origin}/api/email/verify?key=${key}`,
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
      { email, name, url: `${ctx.origin}/editor/edit-password?token=${token}` },
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
    ctx.status = 404;
    return;
  }

  const password = await bcrypt.hash(ctx.request.body.password, 10);
  const email = await tokenRecord.getEmailAuthorization();

  await email.update({ password });
  await tokenRecord.destroy();

  ctx.status = 204;
}
