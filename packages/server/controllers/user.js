import Boom from 'boom';

export async function getUser(ctx) {
  const { User, Organization } = ctx.db.models;
  const { user } = ctx.state;

  const dbUser = await User.findOne({
    where: { id: user.id },
    include: {
      model: Organization,
      through: { where: { UserId: user.id } },
      attributes: ['id'],
    },
  });

  ctx.body = {
    id: dbUser.id,
    name: dbUser.name,
    primaryEmail: dbUser.primaryEmail,
    organizations: dbUser.Organizations.map(({ id }) => ({ id })),
  };
}

export async function updateUser(ctx) {
  const { User, EmailAuthentication, Organization } = ctx.db.models;
  const { user } = ctx.state;
  const { name, primaryEmail } = ctx.request.body;

  const dbUser = await User.findOne({
    where: { id: user.id },
    include: {
      model: Organization,
      through: { where: { UserId: user.id } },
      attributes: ['id'],
    },
  });

  if (primaryEmail !== dbUser.primaryEmail && primaryEmail !== null) {
    const email = await EmailAuthentication.findOne({
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
  };
}
