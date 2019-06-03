import Boom from 'boom';

export async function getUser(ctx) {
  const { User, Organization, EmailAuthorization } = ctx.db.models;
  const { user } = ctx.state;

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

  ctx.body = {
    id: dbUser.id,
    name: dbUser.name,
    primaryEmail: dbUser.primaryEmail,
    organizations: dbUser.Organizations.map(({ id }) => ({ id })),
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
