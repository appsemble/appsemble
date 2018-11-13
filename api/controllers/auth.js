import bcrypt from 'bcrypt';
import crypto from 'crypto';
import Boom from 'boom';

import { sendWelcomeEmail, resendVerificationEmail } from '../utils/email';

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

export async function registerOAuth(ctx) {
  const {
    body: { provider, id, accessToken },
  } = ctx.request;
  const { OAuthAuthorization } = ctx.state.db;
  const auth = await OAuthAuthorization.find({ where: { provider, id, token: accessToken } });

  if (!auth) {
    throw Boom.notFound('Could not find any matching credentials.');
  }

  await auth.createUser();

  ctx.status = 201;
}

export async function connectOAuth(ctx) {
  const {
    body: { provider, id, accessToken, userId },
  } = ctx.request;

  const { OAuthAuthorization, User } = ctx.state.db;
  const auth = await OAuthAuthorization.find({ where: { provider, id, token: accessToken } });
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

  const record = await EmailAuthorization.findByPk(email);
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
