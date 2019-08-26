import Boom from '@hapi/boom';
import crypto from 'crypto';

export async function getUser(ctx) {
  const { User, Organization, EmailAuthorization } = ctx.db.models;
  const { user } = ctx.state;

  const dbUser = await User.findOne({
    where: { id: user.id },
    include: [
      {
        model: Organization,
        attributes: ['id', 'name'],
      },
      {
        model: EmailAuthorization,
      },
    ],
  });

  ctx.body = {
    id: dbUser.id,
    name: dbUser.name,
    primaryEmail: dbUser.primaryEmail,
    organizations: dbUser.Organizations.map(({ id, name }) => ({ id, name })),
    emails: dbUser.EmailAuthorizations.map(({ email, verified }) => ({
      email,
      verified,
      primary: dbUser.primaryEmail === email,
    })),
  };
}

export async function updateUser(ctx) {
  const { User, EmailAuthorization, Organization } = ctx.db.models;
  const { user } = ctx.state;
  const { name, primaryEmail } = ctx.request.body;

  const dbUser = await User.findOne({
    where: { id: user.id },
    include: [
      {
        model: Organization,
        attributes: ['id'],
      },
      {
        model: EmailAuthorization,
      },
    ],
  });

  if (primaryEmail !== dbUser.primaryEmail && primaryEmail !== null) {
    const email = await EmailAuthorization.findOne({
      where: { email: primaryEmail },
    });

    if (!email) {
      throw Boom.notFound('No matching email could be found.');
    }

    if (!email.verified) {
      throw Boom.notAcceptable('This email address has not been verified.');
    }
  }

  await dbUser.update({ name, primaryEmail });

  ctx.body = {
    id: dbUser.id,
    name,
    primaryEmail,
    organizations: dbUser.Organizations.map(({ id }) => ({ id })),
    emails: dbUser.EmailAuthorizations.map(({ email, verified }) => ({
      email,
      verified,
      primary: dbUser.primaryEmail === email,
    })),
  };
}

export async function addEmail(ctx) {
  const { mailer } = ctx;
  const { User, EmailAuthorization } = ctx.db.models;
  const { user } = ctx.state;
  const { email } = ctx.request.body;

  const dbEmail = await EmailAuthorization.findOne({
    where: { email },
  });

  if (dbEmail) {
    throw Boom.conflict('This email has already been registered.');
  }

  const dbUser = await User.findOne({
    where: { id: user.id },
    include: [
      {
        model: EmailAuthorization,
      },
    ],
  });

  const key = crypto.randomBytes(40).toString('hex');
  await dbUser.createEmailAuthorization({ email, key });

  await mailer.sendEmail({ email, name: dbUser.name }, 'emailAdded', {
    url: `${ctx.origin}/verify?token=${key}`,
  });

  ctx.status = 201;
}

export async function removeEmail(ctx) {
  const { User, EmailAuthorization, OAuthAuthorization } = ctx.db.models;
  const { user } = ctx.state;
  const { email } = ctx.request.body;

  const dbUser = await User.findOne({
    where: { id: user.id },
    include: [
      {
        model: EmailAuthorization,
      },
      {
        model: OAuthAuthorization,
      },
    ],
  });

  const dbEmail = await EmailAuthorization.findOne({ where: { email, UserId: user.id } });

  if (!dbEmail) {
    throw Boom.notFound('This email address is not associated with your account.');
  }

  if (dbUser.EmailAuthorizations.length === 1 && !dbUser.OAuthAuthorizations.length) {
    throw Boom.notAcceptable(
      'Deleting this email results in the inability to access this account.',
    );
  }

  await dbUser.removeEmailAuthorizations(dbEmail);
  await dbEmail.destroy();

  ctx.status = 204;
}
