import crypto from 'crypto';

import bcrypt from 'bcrypt';
import Boom from 'boom';

import { sendForgetPasswordEmail, sendWelcomeEmail, resendVerificationEmail } from '../utils/email';

export async function registerEmail(ctx) {
  const { body } = ctx.request;
  const { EmailAuthorization } = ctx.db.models;
  const { smtp } = ctx.state;

  try {
    const password = await bcrypt.hash(body.password, 10);
    const key = crypto.randomBytes(40).toString('hex');
    const record = await EmailAuthorization.create({ ...body, password, key });
    await record.createUser();

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

export async function requestForgetPassword(ctx) {
  const { email } = ctx.request.body;
  const { EmailAuthorization } = ctx.db.models;
  const { smtp } = ctx.state;

  const record = await EmailAuthorization.findByPk(email);

  if (record) {
    const { name } = record;
    const token = crypto.randomBytes(40).toString('hex');
    await record.createForgotPasswordToken({ token });
    await sendForgetPasswordEmail(
      { email, name, url: `${ctx.origin}/editor/resetPassword?token=${token}` },
      smtp,
    );
  }

  ctx.status = 204;
}

export async function resetPassword(ctx) {
  const { token } = ctx.request.body;
  const { ForgotPasswordToken } = ctx.db.models;

  const tokenRecord = await ForgotPasswordToken.findByPk(token);

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
