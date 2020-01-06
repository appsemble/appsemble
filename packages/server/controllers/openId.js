import Boom from '@hapi/boom';
import crypto from 'crypto';
import { Op } from 'sequelize';

// eslint-disable-next-line import/prefer-default-export
export async function getUserInfo(ctx) {
  const { EmailAuthorization, User } = ctx.db.models;
  const { id } = ctx.state.user;

  const user = await User.findOne({
    attributes: ['primaryEmail', 'name'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
    where: { id },
  });

  if (!user) {
    // The authenticated user may have been deleted.
    throw Boom.forbidden();
  }

  const picture = user.primaryEmail
    ? `https://www.gravatar.com/avatar/${crypto
        .createHash('md5')
        .update(user.primaryEmail.toLowerCase())
        .digest('hex')}?s=128&d=mp`
    : null;

  ctx.body = {
    email: user.primaryEmail,
    email_verified: user.primaryEmail && user.EmailAuthorizations[0].verified,
    name: user.name,
    picture,
    sub: id,
  };
}
